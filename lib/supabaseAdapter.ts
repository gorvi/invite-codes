/**
 * Supabase 数据库适配器
 * 用于替换 Upstash Redis，提供免费的数据持久化
 */

import { createClient } from '@supabase/supabase-js'
import { InviteCode, AnalyticsData } from './data'

// Supabase 客户端配置
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing environment variables, falling back to local storage')
}

export class SupabaseAdapter {
  private supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

  constructor() {
    if (this.supabase) {
      console.log('[Supabase] Initialized successfully')
    } else {
      console.warn('[Supabase] Failed to initialize, using local storage')
    }
  }

  getStorageType(): string {
    return 'supabase'
  }

  /**
   * 保存邀请码数据
   */
  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized')
    }

    try {
      // 先清空现有数据，然后插入新数据
      const { error: deleteError } = await this.supabase
        .from('invite_codes')
        .delete()
        .neq('id', 0) // 删除所有记录

      if (deleteError) {
        console.error('[Supabase] Error deleting invite codes:', deleteError)
      }

      // 插入新数据
      const { error: insertError } = await this.supabase
        .from('invite_codes')
        .insert(codes.map(code => ({
          id: code.id,
          code: code.code,
          created_at: code.createdAt,
          is_active: code.status === 'active',
          submitter_name: code.submitterName,
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

      console.log(`[Supabase] Successfully saved ${codes.length} invite codes`)
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
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Supabase] Error loading invite codes:', error)
        return []
      }

      // 转换数据格式
      const codes: InviteCode[] = (data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        createdAt: new Date(row.created_at),
        status: row.is_active ? 'active' : 'invalid',
        votes: {
          worked: row.worked_votes || 0,
          didntWork: row.didnt_work_votes || 0,
          uniqueWorked: row.unique_worked_count || 0,
          uniqueDidntWork: row.unique_didnt_work_count || 0
        },
        copiedCount: row.copy_count || 0,
        uniqueCopiedCount: row.unique_copied_count || 0
      }))

      console.log(`[Supabase] Successfully loaded ${codes.length} invite codes`)
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
      throw new Error('Supabase not initialized')
    }

    try {
      const { error } = await this.supabase
        .from('analytics')
        .upsert({
          id: 1, // 使用固定 ID 存储全局统计数据
          global_best_score: analytics.globalBestScore,
          total_submit_count: analytics.totalSubmitCount,
          total_copy_clicks: analytics.totalCopyClicks,
          total_worked_votes: analytics.totalWorkedVotes,
          total_didnt_work_votes: analytics.totalDidntWorkVotes,
          daily_stats: analytics.dailyStats,
          user_stats: analytics.userStats,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('[Supabase] Error saving analytics:', error)
        throw error
      }

      console.log('[Supabase] Successfully saved analytics data')
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
        globalBestScore: data.global_best_score || 0,
        totalSubmitCount: data.total_submit_count || 0,
        totalCopyClicks: data.total_copy_clicks || 0,
        totalWorkedVotes: data.total_worked_votes || 0,
        totalDidntWorkVotes: data.total_didnt_work_votes || 0,
        dailyStats: data.daily_stats || {},
        userStats: data.user_stats || {}
      }

      console.log('[Supabase] Successfully loaded analytics data')
      return analytics
    } catch (error) {
      console.error('[Supabase] Error in loadAnalytics:', error)
      return null
    }
  }
}
