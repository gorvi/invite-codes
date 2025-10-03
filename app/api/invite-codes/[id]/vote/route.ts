import { NextRequest, NextResponse } from 'next/server'
import { initializeData, inviteCodes, analyticsData, saveData, sendSSENotification, getTodayString } from '@/lib/data'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 确保数据已初始化
    await initializeData()
    
    const body = await request.json()
    const { vote, userId } = body // 'worked' or 'didntWork', 以及 userId
    const { id } = params

    if (!vote || !['worked', 'didntWork'].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      )
    }

    const inviteCode = inviteCodes.find(code => code.id === id)
    
    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      )
    }

    // 生成或获取用户ID
    const userIdentifier = userId || generateUserIdentifier(request)

    // 初始化统计数据
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
    if (!analyticsData.inviteCodeStats[id]) {
      analyticsData.inviteCodeStats[id] = {
        copyClicks: 0,
        workedVotes: 0,
        didntWorkVotes: 0,
      }
    }

    // 初始化投票去重统计
    if (!analyticsData.uniqueVoteStats[id]) {
      analyticsData.uniqueVoteStats[id] = {
        uniqueWorkedVoters: new Set(),
        uniqueDidntWorkVoters: new Set()
      }
    }

    // 更新用户统计
    if (!analyticsData.userStats[userIdentifier]) {
      analyticsData.userStats[userIdentifier] = {
        userId: userIdentifier,
        copyCount: 0,
        voteCount: 0,
        submitCount: 0,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        personalBestScore: 0
      }
    }
    analyticsData.userStats[userIdentifier].voteCount += 1
    analyticsData.userStats[userIdentifier].lastVisit = new Date().toISOString()

    // 更新投票数（统一处理，避免重复计算）
    if (vote === 'worked') {
      // 更新总投票数
      inviteCode.votes.worked += 1
      analyticsData.workedVotes += 1
      analyticsData.dailyStats[today].workedVotes += 1
      analyticsData.inviteCodeStats[id].workedVotes += 1
      
      // 检查是否是新的独立用户投票
      if (!analyticsData.uniqueVoteStats[id].uniqueWorkedVoters.has(userIdentifier)) {
        analyticsData.uniqueVoteStats[id].uniqueWorkedVoters.add(userIdentifier)
        inviteCode.votes.uniqueWorked += 1
      }
    } else { // vote === 'didntWork'
      // 更新总投票数
      inviteCode.votes.didntWork += 1
      analyticsData.didntWorkVotes += 1
      analyticsData.dailyStats[today].didntWorkVotes += 1
      analyticsData.inviteCodeStats[id].didntWorkVotes += 1
      
      // 检查是否是新的独立用户投票
      if (!analyticsData.uniqueVoteStats[id].uniqueDidntWorkVoters.has(userIdentifier)) {
        analyticsData.uniqueVoteStats[id].uniqueDidntWorkVoters.add(userIdentifier)
        inviteCode.votes.uniqueDidntWork += 1
      }
    }

    // 检查邀请码状态逻辑
    if (inviteCode.votes.uniqueWorked >= 4) {
      // 如果独立用户有效投票数 >= 4，说明邀请码已用完
      inviteCode.status = 'used'
    } else if (vote === 'didntWork' && 
               inviteCode.votes.uniqueDidntWork > inviteCode.votes.uniqueWorked && 
               inviteCode.votes.uniqueWorked >= 2) {
      // 如果独立用户无效投票数 > 独立用户有效投票数，且至少有2个独立用户验证过，标记为无效
      inviteCode.status = 'invalid'
    }

    // 保存数据到持久化存储
    try {
      await saveData()
      console.log('[DATA] Saved vote update to storage')
    } catch (error) {
      console.error('[DATA] Failed to save vote update:', error)
    }

    // 🔥 确保返回的对象包含所有字段（如果对象上没有，从 analyticsData 读取）
    const responseData = {
      ...inviteCode,
      copiedCount: inviteCode.copiedCount !== undefined 
        ? inviteCode.copiedCount 
        : (analyticsData.inviteCodeStats[id]?.copyClicks || 0),
      uniqueCopiedCount: inviteCode.uniqueCopiedCount !== undefined 
        ? inviteCode.uniqueCopiedCount 
        : (analyticsData.uniqueCopyStats[id]?.totalUniqueCopies || 0),
    }
    
    // 🔥 同时更新 inviteCode 对象本身，避免下次丢失
    let needsSave = false
    if (inviteCode.copiedCount === undefined) {
      inviteCode.copiedCount = responseData.copiedCount
      needsSave = true
    }
    if (inviteCode.uniqueCopiedCount === undefined) {
      inviteCode.uniqueCopiedCount = responseData.uniqueCopiedCount
      needsSave = true
    }
    
    // 如果更新了字段，重新保存
    if (needsSave) {
      try {
        await saveData()
        console.log('[Vote] Updated and saved copy stats to inviteCode object')
      } catch (error) {
        console.error('[Vote] Failed to save copy stats update:', error)
      }
    }
    
    console.log(`[Vote] Response includes copy stats: copiedCount=${responseData.copiedCount}, uniqueCopiedCount=${responseData.uniqueCopiedCount}`)

    // 发送SSE通知状态变化
    if (inviteCode.status !== 'active') {
      sendSSENotification('update_code', { inviteCode: responseData })
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to vote on invite code' },
      { status: 500 }
    )
  }
}

// 生成用户标识符（基于IP和User-Agent）
function generateUserIdentifier(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // 按天分组
  
  // 创建一个简单的哈希标识符
  const combined = `${ip}-${userAgent}-${timestamp}`
  return Buffer.from(combined).toString('base64').substring(0, 16)
}

