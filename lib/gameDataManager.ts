// lib/gameDataManager.ts - 独立的游戏数据管理器

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export interface GameScore {
  id?: number
  userId: string
  score: number
  level: number
  hamstersWhacked: number
  gameDuration: number
  createdAt: Date
}

export interface GameAnalytics {
  id: number
  globalBestScore: number
  totalGamesPlayed: number
  totalHamstersWhacked: number
  totalPlayers: number
  updatedAt: string
}

export interface GameUserStats {
  userId: string
  personalBestScore: number
  totalGamesPlayed: number
  totalHamstersWhacked: number
  totalPlayTime: number
  firstPlayAt: string
  lastPlayAt: string
}

class GameDataManager {
  private supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

  constructor() {
    if (this.supabase) {
      console.log('[GameDataManager] ✅ Initialized successfully')
    } else {
      console.warn('[GameDataManager] Missing environment variables, cannot save game data')
    }
  }

  /**
   * 保存游戏分数记录
   */
  async saveGameScore(scoreData: Omit<GameScore, 'id' | 'createdAt'>): Promise<GameScore | null> {
    if (!this.supabase) {
      console.error('[GameDataManager] Not initialized, cannot save game score')
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('game_scores')
        .insert({
          user_id: scoreData.userId,
          score: scoreData.score,
          level: scoreData.level,
          hamsters_whacked: scoreData.hamstersWhacked,
          game_duration: scoreData.gameDuration,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('[GameDataManager] Error saving game score:', error)
        return null
      }

      const gameScore: GameScore = {
        id: data.id,
        userId: data.user_id,
        score: data.score,
        level: data.level,
        hamstersWhacked: data.hamsters_whacked,
        gameDuration: data.game_duration,
        createdAt: new Date(data.created_at)
      }

      console.log('[GameDataManager] ✅ Game score saved:', gameScore)
      return gameScore
    } catch (error) {
      console.error('[GameDataManager] Error in saveGameScore:', error)
      return null
    }
  }

  /**
   * 更新游戏全局统计
   */
  async updateGameAnalytics(updates: Partial<GameAnalytics>): Promise<GameAnalytics | null> {
    if (!this.supabase) {
      console.error('[GameDataManager] Not initialized, cannot update game analytics')
      return null
    }

    try {
      const updateData = {
        global_best_score: updates.globalBestScore,
        total_games_played: updates.totalGamesPlayed,
        total_hamsters_whacked: updates.totalHamstersWhacked,
        total_players: updates.totalPlayers,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('game_analytics')
        .upsert({
          id: 1,
          ...updateData
        }, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.error('[GameDataManager] Error updating game analytics:', error)
        return null
      }

      const result: GameAnalytics = {
        id: data.id,
        globalBestScore: data.global_best_score || 0,
        totalGamesPlayed: data.total_games_played || 0,
        totalHamstersWhacked: data.total_hamsters_whacked || 0,
        totalPlayers: data.total_players || 0,
        updatedAt: data.updated_at
      }

      console.log('[GameDataManager] ✅ Game analytics updated successfully:', result)
      return result
    } catch (error) {
      console.error('[GameDataManager] Error in updateGameAnalytics:', error)
      return null
    }
  }

  /**
   * 更新用户游戏统计
   */
  async updateUserStats(userId: string, updates: Partial<GameUserStats>): Promise<GameUserStats | null> {
    if (!this.supabase) {
      console.error('[GameDataManager] Not initialized, cannot update user stats')
      return null
    }

    try {
      const { data: existingStats } = await this.supabase
        .from('game_user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      const updateData = {
        user_id: userId,
        personal_best_score: updates.personalBestScore,
        total_games_played: updates.totalGamesPlayed,
        total_hamsters_whacked: updates.totalHamstersWhacked,
        total_play_time: updates.totalPlayTime,
        first_play_at: existingStats?.first_play_at || new Date().toISOString(),
        last_play_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('game_user_stats')
        .upsert(updateData, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        console.error('[GameDataManager] Error updating user stats:', error)
        return null
      }

      const result: GameUserStats = {
        id: data.id,
        userId: data.user_id,
        personalBestScore: data.personal_best_score || 0,
        totalGamesPlayed: data.total_games_played || 0,
        totalHamstersWhacked: data.total_hamsters_whacked || 0,
        totalPlayTime: data.total_play_time || 0,
        firstPlayAt: data.first_play_at,
        lastPlayAt: data.last_play_at
      }

      console.log('[GameDataManager] ✅ User stats updated for user:', userId, result)
      return result
    } catch (error) {
      console.error('[GameDataManager] Error in updateUserStats:', error)
      return null
    }
  }

  /**
   * 获取游戏全局统计
   */
  async getGameAnalytics(): Promise<GameAnalytics | null> {
    if (!this.supabase) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('game_analytics')
        .select('*')
        .eq('id', 1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('[GameDataManager] Error loading game analytics:', error)
        return null
      }

      if (!data) {
        // 返回默认值
        return {
          id: 1,
          globalBestScore: 0,
          totalGamesPlayed: 0,
          totalHamstersWhacked: 0,
          totalPlayers: 0,
          updatedAt: new Date().toISOString()
        }
      }

      const analytics: GameAnalytics = {
        id: data.id,
        globalBestScore: data.global_best_score || 0,
        totalGamesPlayed: data.total_games_played || 0,
        totalHamstersWhacked: data.total_hamsters_whacked || 0,
        totalPlayers: data.total_players || 0,
        updatedAt: data.updated_at
      }

      console.log('[GameDataManager] ✅ Game analytics loaded:', analytics)
      return analytics
    } catch (error) {
      console.error('[GameDataManager] Error in getGameAnalytics:', error)
      return null
    }
  }

  /**
   * 获取用户游戏统计
   */
  async getUserStats(userId: string): Promise<GameUserStats | null> {
    if (!this.supabase) {
      return null
    }

    try {
      const { data, error } = await this.supabase
        .from('game_user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[GameDataManager] Error loading user stats:', error)
        return null
      }

      if (!data) {
        return null
      }

      const userStats: GameUserStats = {
        userId: data.user_id,
        personalBestScore: data.personal_best_score || 0,
        totalGamesPlayed: data.total_games_played || 0,
        totalHamstersWhacked: data.total_hamsters_whacked || 0,
        totalPlayTime: data.total_play_time || 0,
        firstPlayAt: data.first_play_at,
        lastPlayAt: data.last_play_at
      }

      console.log('[GameDataManager] ✅ User stats loaded for:', userId)
      return userStats
    } catch (error) {
      console.error('[GameDataManager] Error in getUserStats:', error)
      return null
    }
  }

  /**
   * 获取游戏排行榜
   */
  async getLeaderboard(limit: number = 100): Promise<GameScore[]> {
    if (!this.supabase) {
      return []
    }

    try {
      const { data, error } = await this.supabase
        .from('game_scores')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('[GameDataManager] Error loading leaderboard:', error)
        return []
      }

      const leaderboard: GameScore[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        score: row.score,
        level: row.level,
        hamstersWhacked: row.hamsters_whacked,
        gameDuration: row.game_duration,
        createdAt: new Date(row.created_at)
      }))

      console.log('[GameDataManager] ✅ Leaderboard loaded:', leaderboard.length, 'scores')
      return leaderboard
    } catch (error) {
      console.error('[GameDataManager] Error in getLeaderboard:', error)
      return []
    }
  }
}

export const gameDataManager = new GameDataManager()
