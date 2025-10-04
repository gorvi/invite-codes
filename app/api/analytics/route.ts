import { NextRequest, NextResponse } from 'next/server'
import { initializeData, analyticsData, inviteCodes, saveData, getTodayString, getCurrentTimestamp } from '@/lib/data'
import { sora2DataManager } from '@/lib/sora2DataManager'
import { checkDataConsistency, logConsistencyIssue } from '@/lib/dataConsistency'

export async function GET() {
  try {
    // 确保数据已初始化
    await initializeData()
    
    const today = new Date().toISOString().split('T')[0]
    
    // 过滤出活跃的邀请码数量
    let activeCodeCount = inviteCodes.filter(code => code.status === 'active').length
    
    // 计算全量统计数据
    const totalCodeCount = inviteCodes.length
    const usedCodeCount = inviteCodes.filter(code => code.status === 'used').length
    const invalidCodeCount = inviteCodes.filter(code => code.status === 'invalid').length
    
    // 计算历史上成功使用的邀请码数量（uniqueWorked >= 4）
    const successfullyUsedCount = inviteCodes.filter(code => 
      code.votes.uniqueWorked >= 4
    ).length

    // 🔥 检查数据一致性
    const consistencyReport = checkDataConsistency(analyticsData, inviteCodes)
    if (!consistencyReport.isConsistent) {
      logConsistencyIssue(consistencyReport)
      // 使用实际计算的活跃代码数量
      activeCodeCount = consistencyReport.actualActiveCount
    }

    // 返回统计数据
    const stats = {
      ...analyticsData,
      activeCodeCount: activeCodeCount, // 添加活跃邀请码数量
      totalCodeCount: totalCodeCount, // 历史上提交的邀请码总数
      usedCodeCount: usedCodeCount, // 已使用的邀请码数量
      invalidCodeCount: invalidCodeCount, // 无效的邀请码数量
      successfullyUsedCount: successfullyUsedCount, // 成功使用的邀请码数量
      dataConsistency: consistencyReport, // 添加数据一致性报告
      allInviteCodes: inviteCodes, // 返回所有邀请码数据
      todayStats: analyticsData.dailyStats[today] || {
        date: today,
        copyClicks: 0,
        workedVotes: 0,
        didntWorkVotes: 0,
        submitCount: 0,
        uniqueVisitors: 0
      }
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 确保数据已初始化
    await initializeData()
    
    const body = await request.json()
    const { action, inviteCodeId, inviteCode, userId } = body // 新增 userId 参数

    const today = getTodayString()
    const timestamp = getCurrentTimestamp()

    // 生成或获取用户ID
    const userIdentifier = userId || generateUserIdentifier(request)

    // 初始化 dailyStats
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

    // 初始化 inviteCodeStats
    if (inviteCodeId && !analyticsData.inviteCodeStats[inviteCodeId]) {
      analyticsData.inviteCodeStats[inviteCodeId] = {
        copyClicks: 0,
        workedVotes: 0,
        didntWorkVotes: 0,
      }
    }

    // 初始化 uniqueCopyStats
    if (inviteCodeId && !analyticsData.uniqueCopyStats[inviteCodeId]) {
      analyticsData.uniqueCopyStats[inviteCodeId] = {
        totalUniqueCopies: 0,
        uniqueCopiers: new Set()
      }
    }

    // 初始化用户统计
    if (!analyticsData.userStats[userIdentifier]) {
      analyticsData.userStats[userIdentifier] = {
        userId: userIdentifier,
        copyCount: 0,
        voteCount: 0,
        submitCount: 0,
        firstVisit: timestamp,
        lastVisit: timestamp,
        personalBestScore: 0
      }
    }

    // 更新用户最后访问时间
    analyticsData.userStats[userIdentifier].lastVisit = timestamp

    analyticsData.totalClicks += 1

    switch (action) {
      case 'copy':
        analyticsData.copyClicks += 1
        analyticsData.dailyStats[today].copyClicks += 1
        
        // 更新用户复制统计
        analyticsData.userStats[userIdentifier].copyCount += 1
        
        if (inviteCodeId) {
          // 🔥 找到对应的邀请码对象
          const inviteCode = inviteCodes.find(code => code.id === inviteCodeId)
          
          if (inviteCode) {
            // 🔥 更新邀请码对象的复制统计
            if (inviteCode.copiedCount === undefined) {
              inviteCode.copiedCount = 0
            }
            if (inviteCode.uniqueCopiedCount === undefined) {
              inviteCode.uniqueCopiedCount = 0
            }
            
            // 更新总复制次数
            inviteCode.copiedCount += 1
            
            // 检查是否是新的独立用户复制
            const isNewUniqueCopy = !analyticsData.uniqueCopyStats[inviteCodeId]?.uniqueCopiers?.has(userIdentifier)
            if (isNewUniqueCopy) {
              inviteCode.uniqueCopiedCount += 1
              
              // 添加到独立用户集合
              if (!analyticsData.uniqueCopyStats[inviteCodeId]) {
                analyticsData.uniqueCopyStats[inviteCodeId] = {
                  totalUniqueCopies: 0,
                  uniqueCopiers: new Set()
                }
              }
              analyticsData.uniqueCopyStats[inviteCodeId].uniqueCopiers.add(userIdentifier)
              analyticsData.uniqueCopyStats[inviteCodeId].totalUniqueCopies += 1
            }
            
            console.log(`[Copy] Updated code ${inviteCode.code}: copiedCount=${inviteCode.copiedCount}, uniqueCopiedCount=${inviteCode.uniqueCopiedCount}`)
            
            // 🔥 保存更新后的邀请码
            await saveData()
          }
          
          // 更新邀请码总复制次数
          analyticsData.inviteCodeStats[inviteCodeId].copyClicks += 1
          
          // 用户复制统计已在上面更新
        }
        break
      case 'vote_worked':
        analyticsData.userStats[userIdentifier].voteCount += 1
        break
      case 'vote_didntWork':
        analyticsData.userStats[userIdentifier].voteCount += 1
        break
      case 'submit':
        analyticsData.submitCount += 1
        analyticsData.dailyStats[today].submitCount += 1
        analyticsData.userStats[userIdentifier].submitCount += 1
        
        // 对于提交的邀请码，如果它还没有统计数据，这里可以初始化
        if (inviteCode && !analyticsData.inviteCodeStats[inviteCodeId]) {
          const newCode = inviteCodes.find(code => code.code === inviteCode);
          if (newCode) {
            analyticsData.inviteCodeStats[newCode.id] = {
              copyClicks: 0,
              workedVotes: 0,
              didntWorkVotes: 0,
            };
            analyticsData.uniqueCopyStats[newCode.id] = {
              totalUniqueCopies: 0,
              uniqueCopiers: new Set()
            };
            analyticsData.uniqueVoteStats[newCode.id] = {
              uniqueWorkedVoters: new Set(),
              uniqueDidntWorkVoters: new Set()
            };
          }
        }
        break
      default:
        console.warn('Unknown analytics action:', action)
    }

    // ⚡ 优化：使用单用户更新方法，避免批量更新所有数据
    try {
      if (action === 'copy' || action === 'vote_worked' || action === 'vote_didntWork' || action === 'submit') {
        // 只更新当前用户的统计，不保存整个 analyticsData
        await sora2DataManager.updateSingleUserStats(userIdentifier, {
          copyCount: analyticsData.userStats[userIdentifier].copyCount,
          voteCount: analyticsData.userStats[userIdentifier].voteCount,
          submitCount: analyticsData.userStats[userIdentifier].submitCount,
          lastVisit: timestamp
        })
        console.log(`[Analytics] ⚡ Updated single user stats for: ${userIdentifier}`)
      } else {
        // 对于其他操作，仍然保存完整数据
        await saveData()
        console.log('[Analytics] Saved analytics data to storage')
      }
    } catch (error) {
      console.error('[Analytics] Failed to save analytics data:', error)
    }
    
    return NextResponse.json({ 
      success: true, 
      action, 
      timestamp, 
      userId: userIdentifier,
      totalCopies: inviteCodeId ? analyticsData.inviteCodeStats[inviteCodeId]?.copyClicks || 0 : 0,
      uniqueCopies: inviteCodeId ? analyticsData.uniqueCopyStats[inviteCodeId]?.totalUniqueCopies || 0 : 0
    })
    
  } catch (error) {
    console.error('Error recording analytics event:', error)
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
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
