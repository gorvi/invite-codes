// lib/sora2DataManager.ts - Sora 2 邀请码业务数据管理器

import { createClient } from '@supabase/supabase-js'
import { getBeijingTimeISOString } from './timeUtils'
import { InviteCode } from './data'

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
   * 获取 Supabase 客户端实例（用于敏感词验证器等）
   */
  getSupabaseClient() {
    return this.supabase
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
   * ⚡ 新增：更新单个用户统计 (优化版本)
   */
  async updateSingleUserStats(userId: string, updates: {
    copyCount?: number
    voteCount?: number
    submitCount?: number
    lastVisit?: string
  }): Promise<void> {
    if (!this.supabase) {
      console.error('[Sora2DataManager] Not initialized, cannot update user stats')
      return
    }

    try {
      // 获取现有用户数据
      const { data: existingStats } = await this.supabase
        .from('sora2_user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      const updateData = {
        user_id: userId,
        copy_count: updates.copyCount ?? existingStats?.copy_count ?? 0,
        vote_count: updates.voteCount ?? existingStats?.vote_count ?? 0,
        submit_count: updates.submitCount ?? existingStats?.submit_count ?? 0,
        first_visit: existingStats?.first_visit || getBeijingTimeISOString(),
        last_visit: updates.lastVisit || getBeijingTimeISOString(),
        updated_at: getBeijingTimeISOString()
      }

      const { error } = await this.supabase
        .from('sora2_user_stats')
        .upsert(updateData, { onConflict: 'user_id' })

      if (error) {
        console.error('[Sora2DataManager] Error updating single user stats:', error)
        throw error
      }

      console.log(`[Sora2DataManager] ✅ Updated user stats for: ${userId}`)
    } catch (error) {
      console.error('[Sora2DataManager] Error in updateSingleUserStats:', error)
      throw error
    }
  }

}

export const sora2DataManager = new Sora2DataManager()
