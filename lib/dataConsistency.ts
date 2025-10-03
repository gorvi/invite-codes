/**
 * 数据一致性检查工具
 */

import { InviteCode } from './data'

export interface ConsistencyReport {
  timestamp: string
  reportedActiveCount: number
  actualActiveCount: number
  isConsistent: boolean
  discrepancy?: number
  codes: {
    total: number
    active: number
    used: number
    invalid: number
  }
}

/**
 * 检查数据一致性
 */
export function checkDataConsistency(
  analyticsData: any,
  inviteCodes: InviteCode[]
): ConsistencyReport {
  const timestamp = new Date().toISOString()
  
  // 从分析数据中获取报告的活跃代码数量
  const reportedActiveCount = analyticsData.activeCodeCount || 0
  
  // 从实际代码列表中计算活跃代码数量
  const actualActiveCount = inviteCodes.filter(code => code.status === 'active').length
  
  // 计算各种状态的代码数量
  const totalCodes = inviteCodes.length
  const activeCodes = inviteCodes.filter(code => code.status === 'active').length
  const usedCodes = inviteCodes.filter(code => code.status === 'used').length
  const invalidCodes = inviteCodes.filter(code => code.status === 'invalid').length
  
  // 检查一致性
  const isConsistent = reportedActiveCount === actualActiveCount
  const discrepancy = Math.abs(reportedActiveCount - actualActiveCount)
  
  return {
    timestamp,
    reportedActiveCount,
    actualActiveCount,
    isConsistent,
    discrepancy: isConsistent ? undefined : discrepancy,
    codes: {
      total: totalCodes,
      active: activeCodes,
      used: usedCodes,
      invalid: invalidCodes
    }
  }
}

/**
 * 记录数据一致性问题
 */
export function logConsistencyIssue(report: ConsistencyReport): void {
  if (!report.isConsistent) {
    console.error(`[DataConsistency] Inconsistency detected at ${report.timestamp}`)
    console.error(`[DataConsistency] Reported active codes: ${report.reportedActiveCount}`)
    console.error(`[DataConsistency] Actual active codes: ${report.actualActiveCount}`)
    console.error(`[DataConsistency] Discrepancy: ${report.discrepancy}`)
    console.error(`[DataConsistency] Code breakdown:`, report.codes)
  }
}

/**
 * 自动修复数据不一致问题
 */
export function autoFixDataInconsistency(
  analyticsData: any,
  inviteCodes: InviteCode[]
): { fixed: boolean; message: string } {
  const report = checkDataConsistency(analyticsData, inviteCodes)
  
  if (report.isConsistent) {
    return {
      fixed: false,
      message: 'Data is already consistent'
    }
  }
  
  // 使用实际代码列表的数量更新分析数据
  analyticsData.activeCodeCount = report.actualActiveCount
  
  return {
    fixed: true,
    message: `Fixed inconsistency: Updated activeCodeCount from ${report.reportedActiveCount} to ${report.actualActiveCount}`
  }
}
