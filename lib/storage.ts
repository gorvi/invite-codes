// lib/storage.ts
import fs from 'fs'
import path from 'path'
import { InviteCode } from './data'

const DATA_DIR = path.join(process.cwd(), 'data')
const CODES_FILE = path.join(DATA_DIR, 'invite-codes.json')
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json')

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// 保存邀请码到文件
export function saveInviteCodes(codes: InviteCode[]) {
  try {
    ensureDataDir()
    // 将 Date 对象转换为字符串
    const serializedCodes = codes.map(code => ({
      ...code,
      createdAt: code.createdAt.toISOString(),
      submittedAt: (code as any).submittedAt?.toISOString?.() || new Date().toISOString()
    }))
    fs.writeFileSync(CODES_FILE, JSON.stringify(serializedCodes, null, 2))
  } catch (error) {
    console.error('Error saving invite codes:', error)
  }
}

// 从文件加载邀请码
export function loadInviteCodes(): InviteCode[] {
  try {
    if (!fs.existsSync(CODES_FILE)) {
      return []
    }
    const data = fs.readFileSync(CODES_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    // 将字符串转回 Date 对象
    return parsed.map((code: any) => ({
      ...code,
      createdAt: new Date(code.createdAt),
      submittedAt: new Date(code.submittedAt || code.createdAt)
    }))
  } catch (error) {
    console.error('Error loading invite codes:', error)
    return []
  }
}

// 保存分析数据
export function saveAnalytics(analytics: any) {
  try {
    ensureDataDir()
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
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(serialized, null, 2))
  } catch (error) {
    console.error('Error saving analytics:', error)
  }
}

// 加载分析数据
export function loadAnalytics(): any {
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) {
      return null
    }
    const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8')
    const parsed = JSON.parse(data)
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
    return parsed
  } catch (error) {
    console.error('Error loading analytics:', error)
    return null
  }
}

