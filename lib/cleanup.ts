import { inviteCodes, analyticsData } from './data'

export function cleanupInactiveInviteCodes() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  let cleanedCount = 0
  
  // 清理超过30天未使用的邀请码
  for (let i = inviteCodes.length - 1; i >= 0; i--) {
    const code = inviteCodes[i]
    const createdAt = new Date(code.createdAt)
    
    if (createdAt < thirtyDaysAgo && code.status === 'active') {
      // 检查是否有任何活动（复制、投票等）
      const hasActivity = analyticsData.inviteCodeStats[code.id]?.copyClicks > 0 ||
                         analyticsData.inviteCodeStats[code.id]?.workedVotes > 0 ||
                         analyticsData.inviteCodeStats[code.id]?.didntWorkVotes > 0
      
      if (!hasActivity) {
        inviteCodes.splice(i, 1)
        cleanedCount++
        console.log(`[Cleanup] Removed inactive invite code: ${code.code}`)
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[Cleanup] Removed ${cleanedCount} inactive invite codes`)
  }
  
  return cleanedCount
}

export function cleanupInactiveUserStats() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  let cleanedCount = 0
  
  // 清理超过7天未访问的用户统计
  Object.keys(analyticsData.userStats).forEach(userId => {
    const stats = analyticsData.userStats[userId] as any
    const lastVisit = new Date(stats.lastVisit)
    
    if (lastVisit < sevenDaysAgo) {
      delete analyticsData.userStats[userId]
      cleanedCount++
      console.log(`[Cleanup] Removed inactive user stats: ${userId}`)
    }
  })
  
  if (cleanedCount > 0) {
    console.log(`[Cleanup] Removed ${cleanedCount} inactive user stats`)
  }
  
  return cleanedCount
}

export function cleanupOldDailyStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  let cleanedCount = 0
  
  // 清理超过30天的每日统计
  Object.keys(analyticsData.dailyStats).forEach(date => {
    const dateObj = new Date(date)
    
    if (dateObj < thirtyDaysAgo) {
      delete analyticsData.dailyStats[date]
      cleanedCount++
      console.log(`[Cleanup] Removed old daily stats: ${date}`)
    }
  })
  
  if (cleanedCount > 0) {
    console.log(`[Cleanup] Removed ${cleanedCount} old daily stats`)
  }
  
  return cleanedCount
}

export function runCleanup() {
  console.log('[Cleanup] Starting cleanup process...')
  
  const inviteCodeCount = cleanupInactiveInviteCodes()
  const userStatsCount = cleanupInactiveUserStats()
  const dailyStatsCount = cleanupOldDailyStats()
  
  const totalCleaned = inviteCodeCount + userStatsCount + dailyStatsCount
  
  console.log(`[Cleanup] Cleanup completed. Total items cleaned: ${totalCleaned}`)
  
  return {
    inviteCodes: inviteCodeCount,
    userStats: userStatsCount,
    dailyStats: dailyStatsCount,
    total: totalCleaned
  }
}