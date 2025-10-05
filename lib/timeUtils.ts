/**
 * 时间工具函数 - 处理北京时间 (UTC+8)
 */

/**
 * 获取当前北京时间
 * @returns 北京时间的 Date 对象
 */
export function getBeijingTime(): Date {
  // 获取当前 UTC 时间
  const now = new Date()
  
  // 北京时区是 UTC+8，即比 UTC 快 8 小时
  // 由于 JavaScript Date 对象内部存储的是 UTC 时间，
  // 我们需要创建一个表示北京时间的 Date 对象
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
  
  return beijingTime
}

/**
 * 获取当前北京时间的 ISO 字符串
 * @returns 北京时间的 ISO 字符串格式
 */
export function getBeijingTimeISOString(): string {
  return getBeijingTime().toISOString()
}

/**
 * 将 Date 对象转换为北京时间字符串
 * @param date Date 对象
 * @returns 北京时间字符串
 */
export function toBeijingTimeString(date: Date): string {
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * 获取当前北京时间的格式化字符串
 * @returns 格式化的北京时间字符串 (YYYY-MM-DD HH:mm:ss)
 */
export function getFormattedBeijingTime(): string {
  const beijingTime = getBeijingTime()
  return beijingTime.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-')
}

/**
 * 创建新的邀请码时生成北京时间
 * @returns 北京时间的 Date 对象
 */
export function createInviteCodeTimestamp(): Date {
  return getBeijingTime()
}

/**
 * 获取今天的北京日期字符串 (YYYY-MM-DD)
 * @returns 今天的北京日期字符串
 */
export function getTodayBeijingDateString(): string {
  const beijingTime = getBeijingTime()
  return beijingTime.toISOString().split('T')[0]
}

/**
 * 验证时间是否为北京时间格式
 * @param timeString 时间字符串
 * @returns 是否为有效的时间格式
 */
export function isValidBeijingTime(timeString: string): boolean {
  try {
    const date = new Date(timeString)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}
