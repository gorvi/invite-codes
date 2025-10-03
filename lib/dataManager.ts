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
    // 每 8 秒自动刷新一次
    this.startAutoRefresh()
  }

  /**
   * 添加数据监听器
   */
  addListener(listener: (data: GlobalData) => void) {
    this.listeners.push(listener)
    
    // 如果已有数据，立即通知新监听器
    if (this.data) {
      listener(this.data)
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
    console.log('[DataManager] Starting data refresh...')

    try {
      const response = await fetch('/api/analytics')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const analyticsData = await response.json()
      
      // 计算活跃代码数量
      const allInviteCodes = analyticsData.allInviteCodes || []
      const actualActiveCount = allInviteCodes.filter((code: any) => code.status === 'active').length

      this.data = {
        inviteCodes: allInviteCodes,
        activeCodeCount: actualActiveCount,
        totalCodeCount: analyticsData.totalCodeCount || 0,
        usedCodeCount: analyticsData.usedCodeCount || 0,
        invalidCodeCount: analyticsData.invalidCodeCount || 0,
        successfullyUsedCount: analyticsData.successfullyUsedCount || 0,
        submitCount: analyticsData.submitCount || 0,
        dataConsistency: analyticsData.dataConsistency,
        lastUpdated: Date.now()
      }

      console.log('[DataManager] Data refreshed:', {
        inviteCodes: this.data.inviteCodes.length,
        activeCount: this.data.activeCodeCount,
        submitCount: this.data.submitCount
      })

      // 通知所有监听器
      this.notifyListeners()
      
      return this.data
    } catch (error) {
      console.error('[DataManager] Failed to refresh data:', error)
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
    }, 8000) // 每 8 秒刷新一次
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

// 创建全局单例
export const dataManager = new DataManager()

// 页面卸载时清理
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    dataManager.destroy()
  })
}
