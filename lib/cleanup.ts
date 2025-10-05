// lib/cleanup.ts - 数据清理机制

import { inviteCodes, analyticsData, saveData } from './data'

/**
 * 清理配置
 */
const CLEANUP_CONFIG = {
  // 'used' 状态的邀请码保留天数
  USED_CODE_RETENTION_DAYS: 7,
  
  // 'invalid' 状态的邀请码保留天数
  INVALID_CODE_RETENTION_DAYS: 3,
  
  // 'active' 状态但长时间无人使用的邀请码天数
  INACTIVE_CODE_DAYS: 30,
  
  // 用户统计数据保留天数（最后访问时间）
  USER_STATS_RETENTION_DAYS: 90,
  
  // 游戏统计历史记录保留条数
  GAME_HISTORY_MAX_RECORDS: 1000,
  
  // 是否自动清理（生产环境建议关闭，手动执行）
  AUTO_CLEANUP_ENABLED: process.env.AUTO_CLEANUP === 'true',
  
  // 自动清理间隔（小时）
  AUTO_CLEANUP_INTERVAL_HOURS: 24,
}

/**
 * 清理过期的 'used' 和 'invalid' 邀请码
 */
export function cleanupExpiredCodes() {
  const now = Date.now()
  const usedRetentionMs = CLEANUP_CONFIG.USED_CODE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  const invalidRetentionMs = CLEANUP_CONFIG.INVALID_CODE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  const inactiveRetentionMs = CLEANUP_CONFIG.INACTIVE_CODE_DAYS * 24 * 60 * 60 * 1000
  
  const initialCount = inviteCodes.length
  
  // 过滤掉过期的邀请码
  const filteredCodes = inviteCodes.filter(code => {
    const codeAge = now - new Date(code.createdAt).getTime()
    
    // 删除过期的 'used' 邀请码
    if (code.status === 'used' && codeAge > usedRetentionMs) {
      console.log(`[Cleanup] Removing used code: ${code.code} (age: ${Math.floor(codeAge / (24 * 60 * 60 * 1000))} days)`)
      return false
    }
    
    // 删除过期的 'invalid' 邀请码
    if (code.status === 'invalid' && codeAge > invalidRetentionMs) {
      console.log(`[Cleanup] Removing invalid code: ${code.code} (age: ${Math.floor(codeAge / (24 * 60 * 60 * 1000))} days)`)
      return false
    }
    
    // 删除长时间无人使用的 'active' 邀请码（没有任何投票或复制）
    if (code.status === 'active' && codeAge > inactiveRetentionMs) {
      const totalActivity = code.votes.worked + code.votes.didntWork + (code.copiedCount || 0)
      if (totalActivity === 0) {
        console.log(`[Cleanup] Removing inactive code: ${code.code} (age: ${Math.floor(codeAge / (24 * 60 * 60 * 1000))} days, no activity)`)
        return false
      }
    }
    
    return true
  })
  
  const removedCount = initialCount - filteredCodes.length
  
  if (removedCount > 0) {
    // 更新内存中的数据
    inviteCodes.length = 0
    inviteCodes.push(...filteredCodes)
    
    // 保存到 Supabase 数据库
    const { sora2DataManager } = await import('./sora2DataManager')
    await sora2DataManager.saveInviteCodes(inviteCodes)
    
    console.log(`[Cleanup] Removed ${removedCount} expired codes. Remaining: ${filteredCodes.length}`)
  } else {
    console.log(`[Cleanup] No expired codes to remove. Total codes: ${inviteCodes.length}`)
  }
  
  return {
    removedCount,
    remainingCount: filteredCodes.length,
  }
}

/**
 * 清理不活跃用户的统计数据
 */
export function cleanupInactiveUserStats() {
  const now = Date.now()
  const retentionMs = CLEANUP_CONFIG.USER_STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000
  
  let removedCount = 0
  
  for (const [userId, stats] of Object.entries(analyticsData.userStats)) {
    const lastVisit = new Date((stats as any).lastVisit).getTime()
    const inactiveDays = Math.floor((now - lastVisit) / (24 * 60 * 60 * 1000))
    
    if (now - lastVisit > retentionMs) {
      delete analyticsData.userStats[userId]
      removedCount++
      console.log(`[Cleanup] Removed inactive user: ${userId} (last visit: ${inactiveDays} days ago)`)
    }
  }
  
  if (removedCount > 0) {
    // 保存用户统计到数据库
    const { sora2DataManager } = await import('./sora2DataManager')
    await sora2DataManager.saveAnalytics(analyticsData)
    console.log(`[Cleanup] Removed ${removedCount} inactive users`)
  } else {
    console.log(`[Cleanup] No inactive users to remove`)
  }
  
  return { removedCount }
}

/**
 * 清理孤立的唯一用户统计（邀请码已删除但统计还在）
 */
export function cleanupOrphanedStats() {
  const validCodeIds = new Set(inviteCodes.map(code => code.id))
  let removedCount = 0
  
  // 清理 uniqueCopyStats
  for (const codeId of Object.keys(analyticsData.uniqueCopyStats)) {
    if (!validCodeIds.has(codeId)) {
      delete analyticsData.uniqueCopyStats[codeId]
      removedCount++
      console.log(`[Cleanup] Removed orphaned copy stats for code: ${codeId}`)
    }
  }
  
  // 清理 uniqueVoteStats
  for (const codeId of Object.keys(analyticsData.uniqueVoteStats)) {
    if (!validCodeIds.has(codeId)) {
      delete analyticsData.uniqueVoteStats[codeId]
      removedCount++
      console.log(`[Cleanup] Removed orphaned vote stats for code: ${codeId}`)
    }
  }
  
  // 清理 inviteCodeStats
  for (const codeId of Object.keys(analyticsData.inviteCodeStats)) {
    if (!validCodeIds.has(codeId)) {
      delete analyticsData.inviteCodeStats[codeId]
      removedCount++
      console.log(`[Cleanup] Removed orphaned invite code stats for code: ${codeId}`)
    }
  }
  
  if (removedCount > 0) {
    // 保存分析数据到数据库
    const { sora2DataManager } = await import('./sora2DataManager')
    await sora2DataManager.saveAnalytics(analyticsData)
    console.log(`[Cleanup] Removed ${removedCount} orphaned stats`)
  } else {
    console.log(`[Cleanup] No orphaned stats to remove`)
  }
  
  return { removedCount }
}

/**
 * 执行完整清理
 */
export function runCleanup() {
  console.log('[Cleanup] Starting full cleanup...')
  const startTime = Date.now()
  
  const results = {
    expiredCodes: cleanupExpiredCodes(),
    inactiveUsers: cleanupInactiveUserStats(),
    orphanedStats: cleanupOrphanedStats(),
    duration: 0,
  }
  
  results.duration = Date.now() - startTime
  
  console.log('[Cleanup] Full cleanup completed in', results.duration, 'ms')
  console.log('[Cleanup] Summary:', JSON.stringify(results, null, 2))
  
  return results
}

// 为了兼容性，保留旧名称
export const runFullCleanup = runCleanup

/**
 * 获取数据统计
 */
export function getDataStats() {
  const activeCodesCount = inviteCodes.filter(c => c.status === 'active').length
  const usedCodesCount = inviteCodes.filter(c => c.status === 'used').length
  const invalidCodesCount = inviteCodes.filter(c => c.status === 'invalid').length
  
  const oldestCode = inviteCodes.reduce((oldest, code) => {
    const codeDate = new Date(code.createdAt)
    const oldestDate = new Date(oldest.createdAt)
    return codeDate < oldestDate ? code : oldest
  }, inviteCodes[0])
  
  const newestCode = inviteCodes.reduce((newest, code) => {
    const codeDate = new Date(code.createdAt)
    const newestDate = new Date(newest.createdAt)
    return codeDate > newestDate ? code : newest
  }, inviteCodes[0])
  
  return {
    totalCodes: inviteCodes.length,
    activeCodesCount,
    usedCodesCount,
    invalidCodesCount,
    totalUsers: Object.keys(analyticsData.userStats).length,
    oldestCode: oldestCode ? {
      code: oldestCode.code,
      age: Math.floor((Date.now() - new Date(oldestCode.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
    } : null,
    newestCode: newestCode ? {
      code: newestCode.code,
      age: Math.floor((Date.now() - new Date(newestCode.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
    } : null,
    uniqueCopyStatsCount: Object.keys(analyticsData.uniqueCopyStats).length,
    uniqueVoteStatsCount: Object.keys(analyticsData.uniqueVoteStats).length,
    config: CLEANUP_CONFIG,
  }
}

/**
 * 启动自动清理定时器（仅在启用时）
 */
let cleanupTimer: NodeJS.Timeout | null = null

export function startAutoCleanup() {
  if (!CLEANUP_CONFIG.AUTO_CLEANUP_ENABLED) {
    console.log('[Cleanup] Auto cleanup is disabled')
    return
  }
  
  if (cleanupTimer) {
    console.log('[Cleanup] Auto cleanup already running')
    return
  }
  
  const intervalMs = CLEANUP_CONFIG.AUTO_CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000
  
  console.log(`[Cleanup] Starting auto cleanup (interval: ${CLEANUP_CONFIG.AUTO_CLEANUP_INTERVAL_HOURS} hours)`)
  
  // 立即执行一次
  runCleanup()
  
  // 然后定时执行
  cleanupTimer = setInterval(() => {
    runCleanup()
  }, intervalMs)
}

export function stopAutoCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
    console.log('[Cleanup] Auto cleanup stopped')
  }
}