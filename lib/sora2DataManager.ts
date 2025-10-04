// lib/sora2DataManager.ts - Sora 2 邀请码业务数据管理器

import { createClient } from '@supabase/supabase-js'
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
   * 保存统计数据
   */
  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot save analytics')
      return
    }

    try {
      const { error } = await this.supabase
        .from('sora2_analytics')
        .upsert({
          id: 1,
          total_submit_count: analytics.submitCount,
          total_copy_clicks: analytics.copyClicks,
          total_worked_votes: analytics.workedVotes,
          total_didnt_work_votes: analytics.didntWorkVotes,
          daily_stats: analytics.dailyStats,
          user_stats: analytics.userStats,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('[Sora2DataManager] Error saving analytics:', error)
        throw error
      }

      console.log('[Sora2DataManager] ✅ Successfully saved analytics data')
    } catch (error) {
      console.error('[Sora2DataManager] Error in saveAnalytics:', error)
      throw error
    }
  }

  /**
   * 加载统计数据
   */
  async loadAnalytics(): Promise<AnalyticsData | null> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot load analytics')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('sora2_analytics')
        .select('*')
        .eq('id', 1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Sora2DataManager] Error loading analytics:', error)
        
        // 如果是 schema cache 错误，尝试重新初始化客户端
        if (error.code === 'PGRST205') {
          console.log('[Sora2DataManager] Schema cache error, retrying in 1 second...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // 重新尝试查询
          const { data: retryData, error: retryError } = await this.supabase
            .from('sora2_analytics')
            .select('*')
            .eq('id', 1)
            .single()
          
          if (retryError && retryError.code !== 'PGRST116') {
            console.error('[Sora2DataManager] Retry failed:', retryError)
            return null
          }
          
          if (retryData) {
            console.log('[Sora2DataManager] ✅ Retry successful')
            // 使用重试的数据继续处理
            const analytics: AnalyticsData = {
              totalClicks: 0,
              copyClicks: retryData.total_copy_clicks || 0,
              workedVotes: retryData.total_worked_votes || 0,
              didntWorkVotes: retryData.total_didnt_work_votes || 0,
              submitCount: retryData.total_submit_count || 0,
              gameStats: {
                globalBestScore: 0, // 游戏数据现在在独立的 game_analytics 表中
                totalGamesPlayed: 0,
                totalHamstersWhacked: 0
              },
              dailyStats: retryData.daily_stats || {},
              inviteCodeStats: {},
              userStats: retryData.user_stats || {},
              uniqueCopyStats: {},
              uniqueVoteStats: {}
            }
            
            console.log('[Sora2DataManager] ✅ Successfully loaded analytics data (retry)')
            return analytics
          }
        }
        
        return null
      }

      if (!data) {
        console.log('[Sora2DataManager] No analytics data found, returning null')
        return null
      }

      const analytics: AnalyticsData = {
        totalClicks: 0, // 计算得出
        copyClicks: data.total_copy_clicks || 0,
        workedVotes: data.total_worked_votes || 0,
        didntWorkVotes: data.total_didnt_work_votes || 0,
        submitCount: data.total_submit_count || 0,
        gameStats: {
          globalBestScore: 0, // 游戏数据现在在独立的 game_analytics 表中
          totalGamesPlayed: 0,
          totalHamstersWhacked: 0
        },
        dailyStats: data.daily_stats || {},
        inviteCodeStats: {}, // 从 dailyStats 计算得出
        userStats: data.user_stats || {},
        uniqueCopyStats: {},
        uniqueVoteStats: {}
      }

      console.log('[Sora2DataManager] ✅ Successfully loaded analytics data')
      return analytics
    } catch (error) {
      console.error('[Sora2DataManager] Error in loadAnalytics:', error)
      return null
    }
  }
}

export const sora2DataManager = new Sora2DataManager()
