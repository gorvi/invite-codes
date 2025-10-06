/**
 * 数据管理模块 - 只保留必要的类型定义
 */

export interface InviteCode {
  id: string
  code: string
  createdAt: Date
  status: 'active' | 'used' | 'invalid'
  votes: {
    worked: number
    didntWork: number
    uniqueWorked: number
    uniqueDidntWork: number
  }
  copiedCount?: number // 总复制次数（不去重）
  uniqueCopiedCount?: number // 独立用户复制次数（去重）
}