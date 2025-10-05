/**
 * 数据管理模块 - 统一使用 Supabase 存储
 */

import { sora2DataManager } from './sora2DataManager'
import { getTodayBeijingDateString, getBeijingTimeISOString, createInviteCodeTimestamp } from './timeUtils'

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
    personalBestScore: number // 个人最佳分数
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
    // 输出环境信息到构建日志
    console.log('🌍 Environment Info:')
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV || 'undefined')
    console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined')
    console.log('VERCEL_URL:', process.env.VERCEL_URL || 'undefined')
    
    console.log(`[DATA] Initializing Sora2 data with storage type: ${sora2DataManager.getStorageType()}`)
    
    // 加载邀请码数据 - 添加数据一致性检查
    const loadedCodes = await sora2DataManager.loadInviteCodes()
    inviteCodes = loadedCodes
    
    // 数据一致性检查
    if (inviteCodes.length > 0) {
      console.log(`[DATA] ✅ Loaded ${inviteCodes.length} invite codes successfully`)
      // 验证数据完整性
      const validCodes = inviteCodes.filter(code => 
        code.id && code.code && code.createdAt && code.status
      )
      if (validCodes.length !== inviteCodes.length) {
        console.warn(`[DATA] ⚠️ Data integrity issue: ${inviteCodes.length - validCodes.length} invalid codes found`)
      }
    } else {
      console.log(`[DATA] ℹ️ No invite codes found (empty database)`)
    }
    
    // 加载分析数据
    const loadedAnalytics = await sora2DataManager.loadAnalytics()
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
 * 保存数据到持久化存储 - 已废弃，直接使用 sora2DataManager
 * @deprecated 使用 sora2DataManager.saveInviteCodes() 和 sora2DataManager.saveAnalytics() 替代
 */
export async function saveData(): Promise<void> {
  console.warn('[DATA] saveData() is deprecated. Use sora2DataManager methods directly.')
  // 不再执行任何操作，所有数据操作直接通过 sora2DataManager 进行
}

/**
 * 获取今日日期字符串（北京时间）
 */
export function getTodayString(): string {
  return getTodayBeijingDateString()
}

export function getCurrentTimestamp(): string {
  return getBeijingTimeISOString()
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
    createdAt: createInviteCodeTimestamp(), // 使用北京时间
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

  // 保存到 Supabase 数据库
  try {
    await sora2DataManager.saveInviteCodes(inviteCodes)
    console.log('[addInviteCode] ✅ Data saved successfully to Supabase database')
  } catch (error) {
    console.error('[addInviteCode] Failed to save data:', error)
    // 即使保存失败，也继续执行，因为数据已经在内存中
  }

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
