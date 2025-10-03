/**
 * 持久化存储管理器
 * 统一管理不同环境下的数据存储策略
 */

import { InviteCode, AnalyticsData } from './data'

export interface StorageAdapter {
  saveInviteCodes(codes: InviteCode[]): Promise<void>
  loadInviteCodes(): Promise<InviteCode[]>
  saveAnalytics(analytics: AnalyticsData): Promise<void>
  loadAnalytics(): Promise<AnalyticsData | null>
}

/**
 * Vercel KV 存储适配器
 */
export class VercelKVAdapter implements StorageAdapter {
  private kv: any = null
  private keyPrefix: string = ''

  constructor() {
    if (typeof window === 'undefined' && (process.env.VERCEL === '1' || process.env.KV_REST_API_URL)) {
      // 输出环境变量信息到构建日志
      console.log('🔍 Environment Variables Debug:')
      console.log('VERCEL:', process.env.VERCEL)
      console.log('VERCEL_ENV:', process.env.VERCEL_ENV)
      console.log('VERCEL_URL:', process.env.VERCEL_URL)
      console.log('NODE_ENV:', process.env.NODE_ENV)
      console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? '✅ Configured' : '❌ Not configured')
      console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? '✅ Configured' : '❌ Not configured')
      
      this.kv = require('@vercel/kv').createClient({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      })
      
      // 根据环境设置键前缀
      this.keyPrefix = this.getKeyPrefix()
      console.log(`[KV] Using key prefix: ${this.keyPrefix}`)
    }
  }

  private getKeyPrefix(): string {
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    
    switch (env) {
      case 'production':
        return 'prod:'
      case 'preview':
        return 'dev:'
      case 'development':
        return 'local:'
      default:
        return 'local:'
    }
  }

  private getKey(baseKey: string): string {
    return `${this.keyPrefix}${baseKey}`
  }

  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('invite_codes')
    const serializableCodes = codes.map(code => ({
      ...code,
      createdAt: code.createdAt.toISOString(),
    }))
    
    try {
      // 添加重试机制
      let retries = 3
      let success = false
      
      while (retries > 0 && !success) {
        try {
          await this.kv.set(key, serializableCodes)
          success = true
          console.log(`[KV] Successfully saved ${codes.length} invite codes to ${key}`)
        } catch (error) {
          console.error(`[KV] Save attempt ${4-retries} failed:`, error)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒后重试
          }
        }
      }
      
      if (!success) {
        throw new Error(`Failed to save invite codes after 3 attempts`)
      }
    } catch (error) {
      console.error(`[KV] Error saving invite codes:`, error)
      throw error
    }
  }

  async loadInviteCodes(): Promise<InviteCode[]> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('invite_codes')
    
    try {
      // 添加重试机制
      let data = null
      let retries = 3
      
      while (retries > 0 && !data) {
        try {
          data = await this.kv.get(key)
          if (data) break
        } catch (error) {
          console.error(`[KV] Load attempt ${4-retries} failed:`, error)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒后重试
          }
        }
      }
      
      if (!data) {
        console.warn(`[KV] Failed to load invite codes after 3 attempts, key: ${key}`)
        return []
      }
      
      console.log(`[KV] Successfully loaded ${data.length} invite codes from ${key}`)
      return data.map((code: any) => ({
        ...code,
        createdAt: new Date(code.createdAt),
      }))
    } catch (error) {
      console.error(`[KV] Error loading invite codes:`, error)
      return []
    }
  }

  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('analytics_data')
    const serialized = this.serializeAnalytics(analytics)
    await this.kv.set(key, serialized)
    console.log(`[KV] Saved analytics data to ${key}`)
  }

  async loadAnalytics(): Promise<AnalyticsData | null> {
    if (!this.kv) throw new Error('Vercel KV not available')
    
    const key = this.getKey('analytics_data')
    const data = await this.kv.get(key)
    if (!data) return null
    
    return this.deserializeAnalytics(data)
  }

  private serializeAnalytics(analytics: AnalyticsData): any {
    return {
      ...analytics,
      uniqueCopyStats: Object.fromEntries(
        Object.entries(analytics.uniqueCopyStats || {}).map(([key, value]) => [
          key,
          {
            totalUniqueCopies: value.totalUniqueCopies,
            uniqueCopiers: Array.from(value.uniqueCopiers),
          },
        ])
      ),
      uniqueVoteStats: Object.fromEntries(
        Object.entries(analytics.uniqueVoteStats || {}).map(([key, value]) => [
          key,
          {
            uniqueWorkedVoters: Array.from(value.uniqueWorkedVoters),
            uniqueDidntWorkVoters: Array.from(value.uniqueDidntWorkVoters),
          },
        ])
      ),
      dailyStats: Object.fromEntries(
        Object.entries(analytics.dailyStats || {}).map(([key, value]) => [
          key,
          {
            ...value,
            date: typeof value.date === 'string' ? value.date : (value.date as Date).toISOString(),
          },
        ])
      ),
      userStats: Object.fromEntries(
        Object.entries(analytics.userStats || {}).map(([key, value]) => [
          key,
          {
            ...value,
            firstVisit: typeof value.firstVisit === 'string' ? value.firstVisit : (value.firstVisit as Date).toISOString(),
            lastVisit: typeof value.lastVisit === 'string' ? value.lastVisit : (value.lastVisit as Date).toISOString(),
          },
        ])
      ),
    }
  }

  private deserializeAnalytics(data: any): AnalyticsData {
    if (!data) return data

    return {
      ...data,
      uniqueCopyStats: Object.fromEntries(
        Object.entries(data.uniqueCopyStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            totalUniqueCopies: value.totalUniqueCopies,
            uniqueCopiers: new Set(value.uniqueCopiers || []),
          },
        ])
      ),
      uniqueVoteStats: Object.fromEntries(
        Object.entries(data.uniqueVoteStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            uniqueWorkedVoters: new Set(value.uniqueWorkedVoters || []),
            uniqueDidntWorkVoters: new Set(value.uniqueDidntWorkVoters || []),
          },
        ])
      ),
      dailyStats: Object.fromEntries(
        Object.entries(data.dailyStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            date: new Date(value.date),
          },
        ])
      ),
      userStats: Object.fromEntries(
        Object.entries(data.userStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            firstVisit: new Date(value.firstVisit),
            lastVisit: new Date(value.lastVisit),
          },
        ])
      ),
    } as AnalyticsData
  }
}

/**
 * 本地文件存储适配器
 */
export class LocalFileAdapter implements StorageAdapter {
  private fs: any
  private path: any

  constructor() {
    if (typeof window === 'undefined') {
      this.fs = require('fs')
      this.path = require('path')
    }
  }

  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    if (!this.fs || !this.path) throw new Error('File system not available')
    
    const dataDir = this.path.join(process.cwd(), 'data')
    if (!this.fs.existsSync(dataDir)) {
      this.fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const filePath = this.path.join(dataDir, 'invite-codes.json')
    const serializableCodes = codes.map(code => ({
      ...code,
      createdAt: code.createdAt.toISOString(),
    }))
    
    this.fs.writeFileSync(filePath, JSON.stringify(serializableCodes, null, 2))
    console.log('[File] Saved invite codes')
  }

  async loadInviteCodes(): Promise<InviteCode[]> {
    if (!this.fs || !this.path) throw new Error('File system not available')
    
    const filePath = this.path.join(process.cwd(), 'data', 'invite-codes.json')
    
    if (!this.fs.existsSync(filePath)) {
      return []
    }
    
    const data = JSON.parse(this.fs.readFileSync(filePath, 'utf8'))
    return data.map((code: any) => ({
      ...code,
      createdAt: new Date(code.createdAt),
    }))
  }

  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    if (!this.fs || !this.path) throw new Error('File system not available')
    
    const dataDir = this.path.join(process.cwd(), 'data')
    if (!this.fs.existsSync(dataDir)) {
      this.fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const filePath = this.path.join(dataDir, 'analytics.json')
    const serialized = this.serializeAnalytics(analytics)
    
    this.fs.writeFileSync(filePath, JSON.stringify(serialized, null, 2))
    console.log('[File] Saved analytics data')
  }

  async loadAnalytics(): Promise<AnalyticsData | null> {
    if (!this.fs || !this.path) throw new Error('File system not available')
    
    const filePath = this.path.join(process.cwd(), 'data', 'analytics.json')
    
    if (!this.fs.existsSync(filePath)) {
      return null
    }
    
    const data = JSON.parse(this.fs.readFileSync(filePath, 'utf8'))
    return this.deserializeAnalytics(data)
  }

  private serializeAnalytics(analytics: AnalyticsData): any {
    return {
      ...analytics,
      uniqueCopyStats: Object.fromEntries(
        Object.entries(analytics.uniqueCopyStats || {}).map(([key, value]) => [
          key,
          {
            totalUniqueCopies: value.totalUniqueCopies,
            uniqueCopiers: Array.from(value.uniqueCopiers),
          },
        ])
      ),
      uniqueVoteStats: Object.fromEntries(
        Object.entries(analytics.uniqueVoteStats || {}).map(([key, value]) => [
          key,
          {
            uniqueWorkedVoters: Array.from(value.uniqueWorkedVoters),
            uniqueDidntWorkVoters: Array.from(value.uniqueDidntWorkVoters),
          },
        ])
      ),
      dailyStats: Object.fromEntries(
        Object.entries(analytics.dailyStats || {}).map(([key, value]) => [
          key,
          {
            ...value,
            date: typeof value.date === 'string' ? value.date : (value.date as Date).toISOString(),
          },
        ])
      ),
      userStats: Object.fromEntries(
        Object.entries(analytics.userStats || {}).map(([key, value]) => [
          key,
          {
            ...value,
            firstVisit: typeof value.firstVisit === 'string' ? value.firstVisit : (value.firstVisit as Date).toISOString(),
            lastVisit: typeof value.lastVisit === 'string' ? value.lastVisit : (value.lastVisit as Date).toISOString(),
          },
        ])
      ),
    }
  }

  private deserializeAnalytics(data: any): AnalyticsData {
    if (!data) return data

    return {
      ...data,
      uniqueCopyStats: Object.fromEntries(
        Object.entries(data.uniqueCopyStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            totalUniqueCopies: value.totalUniqueCopies,
            uniqueCopiers: new Set(value.uniqueCopiers || []),
          },
        ])
      ),
      uniqueVoteStats: Object.fromEntries(
        Object.entries(data.uniqueVoteStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            uniqueWorkedVoters: new Set(value.uniqueWorkedVoters || []),
            uniqueDidntWorkVoters: new Set(value.uniqueDidntWorkVoters || []),
          },
        ])
      ),
      dailyStats: Object.fromEntries(
        Object.entries(data.dailyStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            date: new Date(value.date),
          },
        ])
      ),
      userStats: Object.fromEntries(
        Object.entries(data.userStats || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            firstVisit: new Date(value.firstVisit),
            lastVisit: new Date(value.lastVisit),
          },
        ])
      ),
    } as AnalyticsData
  }
}

/**
 * 持久化管理器
 */
export class PersistenceManager {
  private adapter: StorageAdapter

  constructor() {
    this.adapter = this.createAdapter()
  }

  private createAdapter(): StorageAdapter {
    // 客户端跳过
    if (typeof window !== 'undefined') {
      return new LocalFileAdapter() // 占位符
    }

    // 检查环境并选择合适的存储
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
    
    console.log(`[Persistence] Environment: ${env}`)
    
    // Vercel 环境或配置了 KV 时使用 Vercel KV
    if (process.env.VERCEL === '1' || process.env.KV_REST_API_URL) {
      try {
        const adapter = new VercelKVAdapter()
        console.log(`[Persistence] Using Vercel KV for ${env} environment`)
        return adapter
      } catch (error) {
        console.warn('[Persistence] Vercel KV not available, falling back to file storage:', error)
      }
    }

    // 本地开发环境使用文件存储
    console.log(`[Persistence] Using local file storage for ${env} environment`)
    return new LocalFileAdapter()
  }

  async saveInviteCodes(codes: InviteCode[]): Promise<void> {
    try {
      await this.adapter.saveInviteCodes(codes)
    } catch (error) {
      console.error('[Persistence] Failed to save invite codes:', error)
      throw error
    }
  }

  async loadInviteCodes(): Promise<InviteCode[]> {
    try {
      return await this.adapter.loadInviteCodes()
    } catch (error) {
      console.error('[Persistence] Failed to load invite codes:', error)
      return []
    }
  }

  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    try {
      await this.adapter.saveAnalytics(analytics)
    } catch (error) {
      console.error('[Persistence] Failed to save analytics:', error)
      throw error
    }
  }

  async loadAnalytics(): Promise<AnalyticsData | null> {
    try {
      return await this.adapter.loadAnalytics()
    } catch (error) {
      console.error('[Persistence] Failed to load analytics:', error)
      return null
    }
  }

  /**
   * 获取当前使用的存储类型
   */
  getStorageType(): string {
    if (this.adapter instanceof VercelKVAdapter) {
      return 'vercel-kv'
    } else if (this.adapter instanceof LocalFileAdapter) {
      return 'local-file'
    }
    return 'unknown'
  }
}

// 单例实例
export const persistenceManager = new PersistenceManager()
