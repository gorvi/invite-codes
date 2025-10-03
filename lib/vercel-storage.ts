// lib/vercel-storage.ts
// Vercel KV storage implementation for persistent data

import { kv } from '@vercel/kv'
import { InviteCode } from './data'

const CODES_KEY = 'invite-codes'
const ANALYTICS_KEY = 'analytics'

// 保存邀请码到 Vercel KV
export async function saveInviteCodes(codes: InviteCode[]) {
  try {
    // 将 Date 对象转换为字符串
    const serializedCodes = codes.map(code => ({
      ...code,
      createdAt: code.createdAt.toISOString()
    }))
    
    await kv.set(CODES_KEY, JSON.stringify(serializedCodes))
    console.log(`[KV] Saved ${codes.length} invite codes to Vercel KV`)
  } catch (error) {
    console.error('[KV] Error saving invite codes:', error)
  }
}

// 从 Vercel KV 加载邀请码
export async function loadInviteCodes(): Promise<InviteCode[]> {
  try {
    const data = await kv.get(CODES_KEY)
    if (!data) {
      console.log('[KV] No invite codes found in Vercel KV')
      return []
    }
    
    const parsed = JSON.parse(data as string)
    // 将字符串转回 Date 对象
    const codes = parsed.map((code: any) => ({
      ...code,
      createdAt: new Date(code.createdAt)
    }))
    
    console.log(`[KV] Loaded ${codes.length} invite codes from Vercel KV`)
    return codes
  } catch (error) {
    console.error('[KV] Error loading invite codes:', error)
    return []
  }
}

// 保存分析数据到 Vercel KV
export async function saveAnalytics(analytics: any) {
  try {
    // 将 Map 和 Set 转换为可序列化的格式
    const serialized = {
      ...analytics,
      uniqueCopyStats: Object.fromEntries(
        Object.entries(analytics.uniqueCopyStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            totalUniqueCopies: value?.totalUniqueCopies || 0,
            uniqueCopiers: value?.uniqueCopiers ? Array.from(value.uniqueCopiers) : []
          }
        ])
      ),
      uniqueVoteStats: Object.fromEntries(
        Object.entries(analytics.uniqueVoteStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            worked: value?.uniqueWorkedVoters ? Array.from(value.uniqueWorkedVoters as Set<string>) : [],
            didntWork: value?.uniqueDidntWorkVoters ? Array.from(value.uniqueDidntWorkVoters as Set<string>) : []
          }
        ])
      )
    }
    
    await kv.set(ANALYTICS_KEY, JSON.stringify(serialized))
    console.log('[KV] Saved analytics data to Vercel KV')
  } catch (error) {
    console.error('[KV] Error saving analytics:', error)
  }
}

// 从 Vercel KV 加载分析数据
export async function loadAnalytics(): Promise<any> {
  try {
    const data = await kv.get(ANALYTICS_KEY)
    if (!data) {
      console.log('[KV] No analytics data found in Vercel KV')
      return null
    }
    
    const parsed = JSON.parse(data as string)
    // 将数组转回 Set
    if (parsed.uniqueCopyStats) {
      parsed.uniqueCopyStats = Object.fromEntries(
        Object.entries(parsed.uniqueCopyStats).map(([key, value]: [string, any]) => [
          key,
          {
            totalUniqueCopies: value?.totalUniqueCopies || 0,
            uniqueCopiers: new Set(value?.uniqueCopiers || [])
          }
        ])
      )
    }
    if (parsed.uniqueVoteStats) {
      parsed.uniqueVoteStats = Object.fromEntries(
        Object.entries(parsed.uniqueVoteStats).map(([key, value]: [string, any]) => [
          key,
          {
            uniqueWorkedVoters: new Set(value.worked || value.uniqueWorkedVoters || []),
            uniqueDidntWorkVoters: new Set(value.didntWork || value.uniqueDidntWorkVoters || [])
          }
        ])
      )
    }
    
    console.log('[KV] Loaded analytics data from Vercel KV')
    return parsed
  } catch (error) {
    console.error('[KV] Error loading analytics:', error)
    return null
  }
}
