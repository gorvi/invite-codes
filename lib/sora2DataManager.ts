// lib/sora2DataManager.ts - Sora 2 邀请码业务数据管理器

import { createClient } from '@supabase/supabase-js'
import { getBeijingTimeISOString } from './timeUtils'
import { InviteCode, AnalyticsData } from './data'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export class Sora2DataManager {
  private supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

  constructor() {
    if (this.supabase) {
      console.log('[Sora2DataManager] ✅ Initialized successfully')
    } else {
      console.error('[Sora2DataManager] ❌ Failed to initialize - missing environment variables')
      console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY')
    }
  }

  getStorageType(): string {
    return 'sora2-supabase'
  }

  /**
   * 保存邀请码数据
   */
  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot save invite codes')
      return
    }

    try {
      // 使用 upsert 来更新或插入数据，避免数据丢失
      const { error: upsertError } = await this.supabase
        .from('sora2_invite_codes')
        .upsert(codes.map(code => ({
          id: code.id,
          code: code.code,
          created_at: code.createdAt.toISOString(),
          status: code.status,
          submitter_name: null,
          copy_count: code.copiedCount || 0,
          worked_votes: code.votes.worked,
          didnt_work_votes: code.votes.didntWork,
          unique_copied_count: code.uniqueCopiedCount || 0,
          unique_worked_count: code.votes.uniqueWorked,
          unique_didnt_work_count: code.votes.uniqueDidntWork,
          worked_user_ids: [],
          didnt_work_user_ids: [],
          copied_user_ids: []
        })), {
          onConflict: 'id' // 根据 id 字段处理冲突
        })

      if (upsertError) {
        console.error('[Sora2DataManager] Error upserting invite codes:', upsertError)
        throw upsertError
      }

      console.log(`[Sora2DataManager] ✅ Successfully upserted ${codes.length} invite codes`)
    } catch (error) {
      console.error('[Sora2DataManager] Error in saveInviteCodes:', error)
      throw error
    }
  }

  /**
   * 加载邀请码数据
   */
  async loadInviteCodes(): Promise<InviteCode[]> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot load invite codes')
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('sora2_invite_codes')
        .select('*')

      if (error) {
        console.error('[Sora2DataManager] Error loading invite codes:', error)
        
        // 如果是 schema cache 错误，尝试重试
        if (error.code === 'PGRST205') {
          console.log('[Sora2DataManager] Schema cache error for sora2_invite_codes, retrying in 1 second...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const { data: retryData, error: retryError } = await this.supabase
            .from('sora2_invite_codes')
            .select('*')
          
          if (retryError) {
            console.error('[Sora2DataManager] Retry failed for sora2_invite_codes:', retryError)
            return []
          }
          
          if (retryData) {
            console.log('[Sora2DataManager] ✅ Retry successful for sora2_invite_codes')
            const codes: InviteCode[] = (retryData || []).map((row: any) => ({
              id: row.id,
              code: row.code,
              createdAt: new Date(row.created_at),
              status: row.status || (row.is_active ? 'active' : 'invalid'),
              votes: {
                worked: row.worked_votes || 0,
                didntWork: row.didnt_work_votes || 0,
                uniqueWorked: row.unique_worked_count || 0,
                uniqueDidntWork: row.unique_didnt_work_count || 0
              },
              copiedCount: row.copy_count || 0,
              uniqueCopiedCount: row.unique_copied_count || 0
            }))
            
            console.log(`[Sora2DataManager] ✅ Successfully loaded ${codes.length} invite codes (retry)`)
            return codes
          }
        }
        
        return []
      }

      // 转换数据格式
      const codes: InviteCode[] = (data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        createdAt: new Date(row.created_at),
        status: row.status || (row.is_active ? 'active' : 'invalid'),
        votes: {
          worked: row.worked_votes || 0,
          didntWork: row.didnt_work_votes || 0,
          uniqueWorked: row.unique_worked_count || 0,
          uniqueDidntWork: row.unique_didnt_work_count || 0
        },
        copiedCount: row.copy_count || 0,
        uniqueCopiedCount: row.unique_copied_count || 0
      }))

      console.log(`[Sora2DataManager] ✅ Successfully loaded ${codes.length} invite codes`)
      return codes
    } catch (error) {
      console.error('[Sora2DataManager] Error in loadInviteCodes:', error)
      return []
    }
  }

  /**
   * 保存统计数据 (现在直接保存到各个独立的表)
   */
  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot save analytics')
      return
    }

    try {
      // 保存用户统计数据
      if (analytics.userStats && Object.keys(analytics.userStats).length > 0) {
        const userStatsArray = Object.entries(analytics.userStats).map(([userId, stats]) => ({
          user_id: userId,
          copy_count: stats.copyCount || 0,
          vote_count: stats.voteCount || 0,
          submit_count: stats.submitCount || 0,
          first_visit: stats.firstVisit || getBeijingTimeISOString(),
          last_visit: stats.lastVisit || getBeijingTimeISOString(),
          updated_at: getBeijingTimeISOString()
        }))

        if (userStatsArray.length > 0) {
          const { error: userStatsError } = await this.supabase
            .from('sora2_user_stats')
            .upsert(userStatsArray, { onConflict: 'user_id' })

          if (userStatsError) {
            console.error('[Sora2DataManager] Error saving user stats:', userStatsError)
            throw userStatsError
          }
          console.log('[Sora2DataManager] ✅ Successfully saved user stats')
        }
      }

      // 每日统计数据现在是视图，无需保存
      // daily_stats 视图会自动从 sora2_invite_codes 表计算

      console.log('[Sora2DataManager] ✅ Successfully saved analytics data to separate tables')
    } catch (error) {
      console.error('[Sora2DataManager] Error in saveAnalytics:', error)
      throw error
    }
  }

  /**
   * 加载统计数据 (现在从各个独立的表加载)
   */
  async loadAnalytics(): Promise<AnalyticsData | null> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot load analytics')
      return null
    }

    try {
      // 并行加载用户统计和每日统计（视图）
      const [userStatsResult, dailyStatsResult] = await Promise.all([
        this.supabase.from('sora2_user_stats').select('*'),
        this.supabase.from('sora2_daily_stats').select('*')
      ])

      // 处理用户统计数据
      const userStats: any = {}
      if (userStatsResult.data) {
        userStatsResult.data.forEach(user => {
          userStats[user.user_id] = {
            userId: user.user_id,
            copyCount: user.copy_count || 0,
            voteCount: user.vote_count || 0,
            submitCount: user.submit_count || 0,
            firstVisit: user.first_visit,
            lastVisit: user.last_visit,
            personalBestScore: 0 // Sora 2 用户没有游戏分数
          }
        })
      }

      // 处理每日统计数据（从视图）
      const dailyStats: any = {}
      if (dailyStatsResult.data) {
        dailyStatsResult.data.forEach(day => {
          dailyStats[day.date] = {
            date: day.date,
            copyClicks: day.copy_clicks || 0,
            workedVotes: day.worked_votes || 0,
            didntWorkVotes: day.didnt_work_votes || 0,
            submitCount: day.submit_count || 0,
            uniqueVisitors: day.unique_submitters || 0 // 视图中的字段名是 unique_submitters
          }
        })
      }

      // 计算总计数据
      const totalCopyClicks = Object.values(userStats).reduce((sum: number, user: any) => sum + (user.copyCount || 0), 0)
      const totalWorkedVotes = Object.values(userStats).reduce((sum: number, user: any) => sum + (user.voteCount || 0), 0)
      const totalSubmitCount = Object.values(userStats).reduce((sum: number, user: any) => sum + (user.submitCount || 0), 0)

      const analytics: AnalyticsData = {
        totalClicks: 0, // 计算得出
        copyClicks: totalCopyClicks,
        workedVotes: totalWorkedVotes,
        didntWorkVotes: 0, // 需要从邀请码表计算
        submitCount: totalSubmitCount,
        gameStats: { // 游戏统计不再由 Sora2DataManager 管理，这里清空
          globalBestScore: 0,
          totalGamesPlayed: 0,
          totalHamstersWhacked: 0
        },
        dailyStats: dailyStats,
        inviteCodeStats: {}, // 从 dailyStats 计算得出
        userStats: userStats,
        uniqueCopyStats: {},
        uniqueVoteStats: {}
      }

      console.log('[Sora2DataManager] ✅ Successfully loaded analytics data from separate tables')
      return analytics
    } catch (error) {
      console.error('[Sora2DataManager] Error in loadAnalytics:', error)
      return null
    }
  }
}

export const sora2DataManager = new Sora2DataManager()
