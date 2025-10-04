/**
 * Supabase 持久化管理器 - 统一存储解决方案
 * 所有环境（本地、dev、生产）都使用 Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { InviteCode, AnalyticsData } from './data'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export class SupabasePersistenceManager {
  private supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

  constructor() {
    if (this.supabase) {
      console.log('[Supabase] ✅ Initialized successfully')
    } else {
      console.error('[Supabase] ❌ Failed to initialize - missing environment variables')
      console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY')
    }
  }

  /**
   * 保存邀请码数据
   */
  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    if (!this.supabase) {
      console.error('[Supabase] Not initialized, cannot save invite codes')
      return
    }

    try {
      // 先删除所有现有数据
      const { error: deleteError } = await this.supabase
        .from('invite_codes')
        .delete()
        .neq('id', '') // 删除所有记录

      if (deleteError) {
        console.error('[Supabase] Error deleting existing invite codes:', deleteError)
        throw deleteError
      }

      // 插入新数据
      const { error: insertError } = await this.supabase
        .from('invite_codes')
        .insert(codes.map(code => ({
          id: code.id,
          code: code.code,
          created_at: code.createdAt,
          status: code.status, // 使用 status 字段
          submitter_name: null, // InviteCode 接口中没有这个字段
          copy_count: code.copiedCount || 0,
          worked_votes: code.votes.worked,
          didnt_work_votes: code.votes.didntWork,
          unique_copied_count: code.uniqueCopiedCount || 0,
          unique_worked_count: code.votes.uniqueWorked,
          unique_didnt_work_count: code.votes.uniqueDidntWork,
          worked_user_ids: [],
          didnt_work_user_ids: [],
          copied_user_ids: []
        })))

      if (insertError) {
        console.error('[Supabase] Error saving invite codes:', insertError)
        throw insertError
      }

      console.log(`[Supabase] ✅ Successfully saved ${codes.length} invite codes`)
    } catch (error) {
      console.error('[Supabase] Error in saveInviteCodes:', error)
      throw error
    }
  }

  /**
   * 加载邀请码数据
   */
  async loadInviteCodes(): Promise<InviteCode[]> {
    if (!this.supabase) {
      console.error('[Supabase] Not initialized, cannot load invite codes')
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('invite_codes')
        .select('*')

      if (error) {
        console.error('[Supabase] Error loading invite codes:', error)
        throw error
      }

      // 转换数据格式
      const codes: InviteCode[] = (data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        createdAt: new Date(row.created_at),
        status: row.status || (row.is_active ? 'active' : 'invalid'), // 优先使用 status 字段
        votes: {
          worked: row.worked_votes || 0,
          didntWork: row.didnt_work_votes || 0,
          uniqueWorked: row.unique_worked_count || 0,
          uniqueDidntWork: row.unique_didnt_work_count || 0
        },
        copiedCount: row.copy_count || 0,
        uniqueCopiedCount: row.unique_copied_count || 0
      }))

      console.log(`[Supabase] ✅ Successfully loaded ${codes.length} invite codes`)
      return codes
    } catch (error) {
      console.error('[Supabase] Error in loadInviteCodes:', error)
      return []
    }
  }

  /**
   * 保存统计数据
   */
  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.supabase) {
      console.error('[Supabase] Not initialized, cannot save analytics')
      return
    }

    try {
      const { error } = await this.supabase
        .from('analytics')
        .upsert({
          id: 1, // 使用固定 ID 存储全局统计数据
          global_best_score: analytics.gameStats.globalBestScore,
          total_submit_count: analytics.submitCount,
          total_copy_clicks: analytics.copyClicks,
          total_worked_votes: analytics.workedVotes,
          total_didnt_work_votes: analytics.didntWorkVotes,
          total_games_played: analytics.gameStats.totalGamesPlayed,
          total_hamsters_whacked: analytics.gameStats.totalHamstersWhacked,
          daily_stats: analytics.dailyStats,
          user_stats: analytics.userStats,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('[Supabase] Error saving analytics:', error)
        throw error
      }

      console.log('[Supabase] ✅ Successfully saved analytics data')
    } catch (error) {
      console.error('[Supabase] Error in saveAnalytics:', error)
      throw error
    }
  }

  /**
   * 加载统计数据
   */
  async loadAnalytics(): Promise<AnalyticsData | null> {
    if (!this.supabase) {
      console.error('[Supabase] Not initialized, cannot load analytics')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('analytics')
        .select('*')
        .eq('id', 1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('[Supabase] Error loading analytics:', error)
        return null
      }

      if (!data) {
        console.log('[Supabase] No analytics data found, returning null')
        return null
      }

      const analytics: AnalyticsData = {
        totalClicks: 0, // 计算得出
        copyClicks: data.total_copy_clicks || 0,
        workedVotes: data.total_worked_votes || 0,
        didntWorkVotes: data.total_didnt_work_votes || 0,
        submitCount: data.total_submit_count || 0,
        gameStats: {
          globalBestScore: data.global_best_score || 0,
          totalGamesPlayed: data.total_games_played || 0,
          totalHamstersWhacked: data.total_hamsters_whacked || 0
        },
        dailyStats: data.daily_stats || {},
        inviteCodeStats: {}, // 从 dailyStats 计算得出
        userStats: data.user_stats || {},
        uniqueCopyStats: {},
        uniqueVoteStats: {}
      }

      console.log('[Supabase] ✅ Successfully loaded analytics data')
      return analytics
    } catch (error) {
      console.error('[Supabase] Error in loadAnalytics:', error)
      return null
    }
  }

  /**
   * 获取存储类型
   */
  getStorageType(): string {
    return 'supabase'
  }
}

// 创建全局实例
export const supabasePersistence = new SupabasePersistenceManager()
