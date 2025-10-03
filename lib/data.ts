// lib/data.ts

export interface InviteCode {
  id: string
  code: string
  createdAt: Date
  status: 'active' | 'used' | 'invalid'
  votes: {
    worked: number
    didntWork: number
    uniqueWorked: number // 独立用户"有效"投票次数
    uniqueDidntWork: number // 独立用户"无效"投票次数
  }
  copiedCount?: number // 总复制次数（不去重）
  uniqueCopiedCount?: number // 独立用户复制次数（去重）
}

// 尝试从持久化存储加载数据
let loadedCodes: InviteCode[] = []
if (typeof window === 'undefined') {
  // 服务器端才加载（避免客户端错误）
  try {
    const { loadInviteCodes } = require('./storage')
    loadedCodes = loadInviteCodes()
    console.log(`[DATA] Loaded ${loadedCodes.length} invite codes from storage`)
  } catch (error) {
    console.log('[DATA] Starting with empty invite codes (no storage file found)')
  }
}

// 从持久化存储加载，如果没有则从空开始
export let inviteCodes: InviteCode[] = loadedCodes

// 🔥 尝试从持久化存储加载 analyticsData
let loadedAnalytics: any = null
if (typeof window === 'undefined') {
  try {
    const { loadAnalytics } = require('./storage')
    loadedAnalytics = loadAnalytics()
    if (loadedAnalytics) {
      console.log('[DATA] Loaded analytics data from storage')
      
      // 🔥 修复历史数据：如果 submitCount 为 0 但有邀请码，则初始化 submitCount
      if (loadedAnalytics.submitCount === 0 && loadedCodes.length > 0) {
        loadedAnalytics.submitCount = loadedCodes.length
        console.log(`[DATA] Fixed submitCount: initialized to ${loadedCodes.length} based on existing invite codes`)
        
        // 立即保存修复后的数据
        try {
          const { saveAnalytics } = require('./storage')
          saveAnalytics(loadedAnalytics)
          console.log('[DATA] Saved fixed analytics data')
        } catch (error) {
          console.error('[DATA] Failed to save fixed analytics:', error)
        }
      }
    }
  } catch (error) {
    console.log('[DATA] Starting with fresh analytics data (no storage file found)')
  }
}

// 统计数据 - 从文件加载或使用默认值
export let analyticsData = loadedAnalytics || {
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
  dailyStats: {} as Record<string, {
    date: string
    copyClicks: number
    workedVotes: number
    didntWorkVotes: number
    submitCount: number
    uniqueVisitors: number
  }>,
  inviteCodeStats: {
    // 硬编码统计数据已清理，正式上线时从空状态开始
    // '1': {
    //   copyClicks: 10,
    //   workedVotes: 5,
    //   didntWorkVotes: 1,
    // },
    // '2': {
    //   copyClicks: 3,
    //   workedVotes: 2,
    //   didntWorkVotes: 0,
    // },
    // '3': {
    //   copyClicks: 5,
    //   workedVotes: 1,
    //   didntWorkVotes: 1,
    // },
  } as Record<string, {
    copyClicks: number
    workedVotes: number
    didntWorkVotes: number
  }>,
  // 新增用户级别统计
  userStats: {} as Record<string, {
    userId: string
    copyCount: number
    voteCount: number
    submitCount: number
    firstVisit: string
    lastVisit: string
    inviteCodeCopies: Record<string, number> // 每个邀请码的复制次数
  }>,
  // 去重统计 - 记录哪些用户已经复制过哪些邀请码
  uniqueCopyStats: {} as Record<string, {
    totalUniqueCopies: number // 总的独立用户复制次数
    uniqueCopiers: Set<string> // 复制过该邀请码的用户ID集合
  }>,
  // 投票去重统计 - 记录哪些用户已经投票过哪些邀请码
  uniqueVoteStats: {} as Record<string, {
    uniqueWorkedVoters: Set<string> // 投"有效"票的用户ID集合
    uniqueDidntWorkVoters: Set<string> // 投"无效"票的用户ID集合
  }>
}

// 获取今天的日期字符串
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// 获取当前时间戳
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// 提交锁和队列机制 - 防止并发提交问题
export let submissionLock = false
export let submissionQueue: Array<{
  code: string
  resolve: (value: any) => void
  reject: (error: any) => void
}> = []

// 处理提交队列
export async function processSubmissionQueue() {
  if (submissionLock || submissionQueue.length === 0) {
    return
  }

  submissionLock = true
  
  while (submissionQueue.length > 0) {
    const { code, resolve, reject } = submissionQueue.shift()!
    
    try {
      // 检查是否已存在相同的邀请码
      const existingCode = inviteCodes.find(inviteCode => 
        inviteCode.code.toLowerCase() === code.toLowerCase()
      )

      if (existingCode) {
        reject({ error: 'This invite code already exists', status: 409 })
        continue
      }

      // 生成唯一ID
      const newId = String(Date.now() + Math.random().toString(36).substr(2, 9))
      
      const newCode = {
        id: newId,
        code,
        createdAt: new Date(),
        status: 'active' as const,
        votes: { worked: 0, didntWork: 0, uniqueWorked: 0, uniqueDidntWork: 0 },
        copiedCount: 0,           // 🔥 初始化复制统计
        uniqueCopiedCount: 0,     // 🔥 初始化独立用户复制统计
      }
      
      inviteCodes.unshift(newCode)

      // 🔥 增加全局提交计数
      analyticsData.submitCount += 1
      
      // 增加今日提交计数
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

      // 初始化该邀请码的统计数据
      analyticsData.inviteCodeStats[newCode.id] = {
        copyClicks: 0,
        workedVotes: 0,
        didntWorkVotes: 0,
      }
      
      // 初始化投票去重统计
      analyticsData.uniqueVoteStats[newCode.id] = {
        uniqueWorkedVoters: new Set(),
        uniqueDidntWorkVoters: new Set()
      }
      
      // 🔥 初始化复制去重统计
      analyticsData.uniqueCopyStats[newCode.id] = {
        totalUniqueCopies: 0,
        uniqueCopiers: new Set()
      }

      // 🔥 持久化保存
      if (typeof window === 'undefined') {
        try {
          const { saveInviteCodes, saveAnalytics } = require('./storage')
          saveInviteCodes(inviteCodes)
          saveAnalytics(analyticsData)
          console.log('[DATA] Saved invite codes and analytics to storage')
        } catch (error) {
          console.error('[DATA] Failed to save to storage:', error)
        }
      }

      resolve(newCode)
      
      // 发送SSE通知给所有客户端
      sendSSENotification('new_code', { inviteCode: newCode })
    } catch (error) {
      reject({ error: 'Failed to create invite code', status: 500 })
    }
  }
  
  submissionLock = false
}

// SSE通知机制
const sseClients = new Set<ReadableStreamDefaultController>()

export function addSSEClient(controller: ReadableStreamDefaultController) {
  sseClients.add(controller)
}

export function removeSSEClient(controller: ReadableStreamDefaultController) {
  sseClients.delete(controller)
}

export function sendSSENotification(type: string, data: any) {
  const message = JSON.stringify({ type, ...data })
  const encoder = new TextEncoder()
  
  sseClients.forEach(controller => {
    try {
      controller.enqueue(encoder.encode(`data: ${message}\n\n`))
    } catch (error) {
      // 客户端已断开连接，移除
      sseClients.delete(controller)
    }
  })
}

// 添加邀请码的简化函数
export function addInviteCode(code: string, submitterName?: string) {
  // 检查是否已存在相同的邀请码
  const existingCode = inviteCodes.find(inviteCode => 
    inviteCode.code.toLowerCase() === code.toLowerCase()
  )

  if (existingCode) {
    throw new Error('This invite code already exists')
  }

  // 生成唯一ID
  const newId = String(Date.now() + Math.random().toString(36).substr(2, 9))
  
  const newCode = {
    id: newId,
    code,
    createdAt: new Date(),
    status: 'active' as const,
    votes: { worked: 0, didntWork: 0, uniqueWorked: 0, uniqueDidntWork: 0 },
    copiedCount: 0,
    uniqueCopiedCount: 0,
  }
  
  inviteCodes.unshift(newCode)

  // 增加全局提交计数
  analyticsData.submitCount += 1
  
  // 增加今日提交计数
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

  // 初始化该邀请码的统计数据
  analyticsData.inviteCodeStats[newCode.id] = {
    copyClicks: 0,
    workedVotes: 0,
    didntWorkVotes: 0,
  }
  
  // 初始化投票去重统计
  analyticsData.uniqueVoteStats[newCode.id] = {
    uniqueWorkedVoters: new Set(),
    uniqueDidntWorkVoters: new Set()
  }
  
  // 初始化复制去重统计
  analyticsData.uniqueCopyStats[newCode.id] = {
    totalUniqueCopies: 0,
    uniqueCopiers: new Set()
  }

  // 持久化保存
  if (typeof window === 'undefined') {
    try {
      const { saveInviteCodes, saveAnalytics } = require('./storage')
      saveInviteCodes(inviteCodes)
      saveAnalytics(analyticsData)
      console.log('[DATA] Saved invite codes and analytics to storage')
    } catch (error) {
      console.error('[DATA] Failed to save to storage:', error)
    }
  }

  // 发送SSE通知给所有客户端
  sendSSENotification('new_code', { inviteCode: newCode })
  
  return newCode
}