/**
 * 全局数据管理器
 * 统一管理所有数据获取和同步，避免重复 API 调用
 */

import { InviteCode } from './data'

export interface GlobalData {
  inviteCodes: InviteCode[]
  activeCodeCount: number
  totalCodeCount: number
  usedCodeCount: number
  invalidCodeCount: number
  successfullyUsedCount: number
  submitCount: number
  dataConsistency: any
  lastUpdated: number
}

class DataManager {
  private data: GlobalData | null = null
  private listeners: Array<(data: GlobalData) => void> = []
  private refreshInterval: NodeJS.Timeout | null = null
  private isRefreshing = false

  constructor() {
    // 延迟启动自动刷新，确保组件已加载
    setTimeout(() => {
      this.startAutoRefresh()
    }, 1000)
  }

  /**
   * 添加数据监听器
   */
  addListener(listener: (data: GlobalData) => void) {
    this.listeners.push(listener)
    
    // 如果已有数据，立即通知新监听器
    if (this.data) {
      listener(this.data)
    } else {
      // 如果没有数据，立即刷新数据（避免递归调用 getData）
      this.refreshData().then((data) => {
        if (data) {
          listener(data)
        }
      })
    }
  }

  /**
   * 移除数据监听器
   */
  removeListener(listener: (data: GlobalData) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * 通知所有监听器数据更新
   */
  private notifyListeners() {
    if (this.data) {
      this.listeners.forEach(listener => {
        try {
          listener(this.data!)
        } catch (error) {
          console.error('[DataManager] Listener error:', error)
        }
      })
    }
  }

  /**
   * 获取数据（如果缓存有效则直接返回，否则重新获取）
   */
  async getData(forceRefresh = false): Promise<GlobalData | null> {
    const now = Date.now()
    const cacheAge = this.data ? now - this.data.lastUpdated : Infinity
    const maxCacheAge = 5000 // 5 秒缓存

    // 如果数据较新且不强制刷新，返回缓存
    if (this.data && cacheAge < maxCacheAge && !forceRefresh) {
      console.log('[DataManager] Using cached data, age:', cacheAge, 'ms')
      return this.data
    }

    // 如果正在刷新中，等待完成
    if (this.isRefreshing) {
      console.log('[DataManager] Already refreshing, waiting...')
      return new Promise((resolve) => {
        const checkRefresh = () => {
          if (!this.isRefreshing && this.data) {
            resolve(this.data)
          } else {
            setTimeout(checkRefresh, 100)
          }
        }
        checkRefresh()
      })
    }

    return this.refreshData()
  }

  /**
   * 刷新数据
   */
  async refreshData(): Promise<GlobalData | null> {
    if (this.isRefreshing) {
      console.log('[DataManager] Refresh already in progress')
      return this.data
    }

    this.isRefreshing = true
    console.log('[DataManager] Starting unified data refresh...')

    try {
      // 🔥 使用统一的仪表板接口，一次性获取所有数据
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const dashboardData = await response.json()
      
      // 🔥 详细调试 API 响应数据
      console.log('[DataManager] 🔍 API Response Debug:', {
        hasActiveInviteCodes: !!dashboardData.activeInviteCodes,
        activeInviteCodesType: typeof dashboardData.activeInviteCodes,
        activeInviteCodesLength: dashboardData.activeInviteCodes?.length,
        activeInviteCodesIsArray: Array.isArray(dashboardData.activeInviteCodes),
        activeInviteCodesSample: dashboardData.activeInviteCodes?.slice(0, 2),
        allKeys: Object.keys(dashboardData)
      })
      
      // 🔥 确保 activeInviteCodes 存在且为数组
      const activeInviteCodes = dashboardData.activeInviteCodes || []
      console.log('[DataManager] 🔍 Final activeInviteCodes:', {
        length: activeInviteCodes.length,
        isArray: Array.isArray(activeInviteCodes),
        sample: activeInviteCodes.slice(0, 3).map(c => c.code)
      })
      
      // 直接使用统一接口返回的数据
      this.data = {
        inviteCodes: activeInviteCodes, // 只返回活跃的邀请码
        activeCodeCount: dashboardData.activeCodeCount || 0,
        totalCodeCount: dashboardData.totalCodeCount || 0,
        usedCodeCount: dashboardData.usedCodeCount || 0,
        invalidCodeCount: dashboardData.invalidCodeCount || 0,
        successfullyUsedCount: dashboardData.successfullyUsedCount || 0,
        submitCount: dashboardData.submitCount || 0,
        dataConsistency: dashboardData.dataConsistency,
        lastUpdated: Date.now()
      }

      console.log('[DataManager] ✅ Unified data refreshed:', {
        inviteCodes: this.data.inviteCodes.length,
        activeCount: this.data.activeCodeCount,
        submitCount: this.data.submitCount,
        // 🔥 详细调试信息：显示每个邀请码的完整统计
        inviteCodesWithStats: this.data.inviteCodes.map(code => ({
          code: code.code,
          copiedCount: code.copiedCount,
          uniqueCopiedCount: code.uniqueCopiedCount,
          workedVotes: code.votes.worked,
          uniqueWorked: code.votes.uniqueWorked,
          didntWorkVotes: code.votes.didntWork,
          uniqueDidntWork: code.votes.uniqueDidntWork,
          status: code.status
        }))
      })

      // 通知所有监听器
      console.log('[DataManager] Notifying', this.listeners.length, 'listeners')
      this.notifyListeners()
      
      return this.data
    } catch (error) {
      console.error('[DataManager] Failed to refresh unified data:', error)
      return this.data // 返回旧数据
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * 开始自动刷新
   */
  private startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    this.refreshInterval = setInterval(() => {
      console.log('[DataManager] Auto-refresh triggered')
      this.refreshData()
    }, 60000) // 每 60 秒刷新一次（减少数据库调用）
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  /**
   * 手动触发刷新（用于用户操作后）
   */
  async triggerRefresh() {
    console.log('[DataManager] Manual refresh triggered')
    return this.refreshData()
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.stopAutoRefresh()
    this.listeners = []
    this.data = null
  }
}

// 创建全局单例（仅在客户端）
let dataManagerInstance: DataManager | null = null

export const getDataManager = (): DataManager => {
  if (typeof window === 'undefined') {
    throw new Error('DataManager can only be used in browser')
  }
  
  if (!dataManagerInstance) {
    console.log('[DataManager] Creating new instance')
    dataManagerInstance = new DataManager()
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
      dataManagerInstance?.destroy()
    })
  }
  
  return dataManagerInstance
}

// 导出全局实例访问器
export const dataManager = {
  getData: (forceRefresh = false) => getDataManager().getData(forceRefresh),
  refreshData: () => getDataManager().refreshData(),
  addListener: (listener: (data: GlobalData) => void) => getDataManager().addListener(listener),
  removeListener: (listener: (data: GlobalData) => void) => getDataManager().removeListener(listener),
  triggerRefresh: () => getDataManager().triggerRefresh(),
  stopAutoRefresh: () => getDataManager().stopAutoRefresh(),
  destroy: () => getDataManager().destroy()
}
