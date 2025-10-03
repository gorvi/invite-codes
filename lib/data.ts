/**
 * 数据管理模块 - 使用新的持久化管理器
 */

import { persistenceManager } from './persistence'

export interface InviteCode {
  id: string
  code: string
  createdAt: Date
  status: 'active' | 'used' | 'invalid'
  votes: {
    worked: number
    didntWork: number
    uniqueWorked: number
    uniqueDidntWork: number
  }
  copiedCount?: number // 总复制次数（不去重）
  uniqueCopiedCount?: number // 独立用户复制次数（去重）
}

export interface AnalyticsData {
  totalClicks: number
  copyClicks: number
  workedVotes: number
  didntWorkVotes: number
  submitCount: number
  // 游戏统计
  gameStats: {
    globalBestScore: number
    totalGamesPlayed: number
    totalHamstersWhacked: number
  }
  dailyStats: Record<string, {
    date: string
    copyClicks: number
    workedVotes: number
    didntWorkVotes: number
    submitCount: number
    uniqueVisitors: number
  }>
  inviteCodeStats: Record<string, {
    copyClicks: number
    workedVotes: number
    didntWorkVotes: number
  }>
  // 新增用户级别统计
  userStats: Record<string, {
    userId: string
    copyCount: number
    voteCount: number
    submitCount: number
    firstVisit: string
    lastVisit: string
  }>
  uniqueCopyStats: Record<string, {
    totalUniqueCopies: number
    uniqueCopiers: Set<string>
  }>
  uniqueVoteStats: Record<string, {
    uniqueWorkedVoters: Set<string>
    uniqueDidntWorkVoters: Set<string>
  }>
}

// 初始化数据存储
export let inviteCodes: InviteCode[] = []
export let analyticsData: AnalyticsData = {
  totalClicks: 0,
  copyClicks: 0,
  workedVotes: 0,
  didntWorkVotes: 0,
  submitCount: 0,
  // 游戏统计
  gameStats: {
    globalBestScore: 0,
    totalGamesPlayed: 0,
    totalHamstersWhacked: 0,
  },
  dailyStats: {},
  inviteCodeStats: {},
  userStats: {},
  uniqueCopyStats: {},
  uniqueVoteStats: {},
}

// 数据初始化标志
let isInitialized = false

/**
 * 初始化数据 - 从持久化存储加载
 */
export async function initializeData(): Promise<void> {
  if (isInitialized || typeof window !== 'undefined') {
    return
  }

  try {
    console.log(`[DATA] Initializing data with storage type: ${persistenceManager.getStorageType()}`)
    
    // 加载邀请码数据
    const loadedCodes = await persistenceManager.loadInviteCodes()
    inviteCodes = loadedCodes
    console.log(`[DATA] Loaded ${inviteCodes.length} invite codes`)
    
    // 加载分析数据
    const loadedAnalytics = await persistenceManager.loadAnalytics()
    if (loadedAnalytics) {
      Object.assign(analyticsData, loadedAnalytics)
      console.log('[DATA] Loaded analytics data')
    } else {
      console.log('[DATA] No analytics data found, using defaults')
    }
    
    isInitialized = true
  } catch (error) {
    console.error('[DATA] Failed to initialize data:', error)
    isInitialized = true // 标记为已初始化，避免重复尝试
  }
}

/**
 * 保存数据到持久化存储
 */
export async function saveData(): Promise<void> {
  if (typeof window !== 'undefined') {
    return
  }

  try {
    await Promise.all([
      persistenceManager.saveInviteCodes(inviteCodes),
      persistenceManager.saveAnalytics(analyticsData)
    ])
    console.log('[DATA] Data saved successfully')
  } catch (error) {
    console.error('[DATA] Failed to save data:', error)
  }
}

/**
 * 获取今日日期字符串
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 添加邀请码
 */
export async function addInviteCode(code: string, submitterName?: string): Promise<InviteCode> {
  // 确保数据已初始化
  await initializeData()

  // 检查是否已存在相同的邀请码
  const existingCode = inviteCodes.find(inviteCode => 
    inviteCode.code.toLowerCase() === code.toLowerCase()
  )

  if (existingCode) {
    throw new Error('This invite code already exists')
  }

  // 创建新的邀请码
  const newId = String(Date.now() + Math.random().toString(36).substr(2, 9))
  const newCode: InviteCode = {
    id: newId,
    code,
    createdAt: new Date(),
    status: 'active',
    votes: { worked: 0, didntWork: 0, uniqueWorked: 0, uniqueDidntWork: 0 },
    copiedCount: 0,
    uniqueCopiedCount: 0,
  }

  // 添加到数组开头
  inviteCodes.unshift(newCode)

  // 更新统计
  analyticsData.submitCount += 1
  const today = getTodayString()
  if (!analyticsData.dailyStats[today]) {
    analyticsData.dailyStats[today] = {
      date: today,
      copyClicks: 0,
      workedVotes: 0,
      didntWorkVotes: 0,
      submitCount: 0,
      uniqueVisitors: 0
    }
  }
  analyticsData.dailyStats[today].submitCount += 1

  // 初始化邀请码统计
  analyticsData.inviteCodeStats[newCode.id] = {
    copyClicks: 0,
    workedVotes: 0,
    didntWorkVotes: 0,
  }

  // 初始化唯一统计
  analyticsData.uniqueVoteStats[newCode.id] = {
    uniqueWorkedVoters: new Set(),
    uniqueDidntWorkVoters: new Set()
  }

  analyticsData.uniqueCopyStats[newCode.id] = {
    totalUniqueCopies: 0,
    uniqueCopiers: new Set()
  }

  // 保存到持久化存储
  await saveData()

  // 发送SSE通知给所有客户端
  sendSSENotification('new_code', { inviteCode: newCode })
  
  return newCode
}

/**
 * 发送SSE通知
 */
function sendSSENotification(type: string, data: any): void {
  if (sseClients.length > 0) {
    const message = `data: ${JSON.stringify({ type, data })}\n\n`
    sseClients.forEach((client: any) => {
      try {
        client.enqueue(message)
      } catch (error) {
        console.error('Error sending SSE message:', error)
        // 移除无效的客户端
        removeSSEClient(client)
      }
    })
  }
}

// SSE 客户端管理
let sseClients: any[] = []

export function addSSEClient(client: any) {
  sseClients.push(client)
  console.log(`[SSE] Client added, total: ${sseClients.length}`)
}

export function removeSSEClient(client: any) {
  const index = sseClients.indexOf(client)
  if (index > -1) {
    sseClients.splice(index, 1)
    console.log(`[SSE] Client removed, total: ${sseClients.length}`)
  }
}

// 导出其他需要的函数
export { sendSSENotification }
