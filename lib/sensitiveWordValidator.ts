import { sora2DataManager } from './sora2DataManager'

/**
 * 敏感词验证器
 */
export class SensitiveWordValidator {
  private static sensitiveWords: string[] = []
  private static isInitialized = false

  /**
   * 初始化敏感词列表
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const words = await this.loadSensitiveWords()
      this.sensitiveWords = words.map(w => w.toLowerCase().trim())
      this.isInitialized = true
      console.log(`[SensitiveWordValidator] ✅ Initialized with ${this.sensitiveWords.length} sensitive words`)
    } catch (error) {
      console.error('[SensitiveWordValidator] Failed to initialize:', error)
      // 使用默认敏感词作为后备
      this.sensitiveWords = this.getDefaultSensitiveWords()
      this.isInitialized = true
    }
  }

  /**
   * 从数据库加载敏感词
   */
  private static async loadSensitiveWords(): Promise<string[]> {
    const supabase = sora2DataManager.getSupabaseClient()
    if (!supabase) {
      throw new Error('Sora2DataManager not initialized')
    }

    const { data, error } = await supabase
      .from('sensitive_words')
      .select('word')
      .eq('is_active', true)
      .order('severity_level', { ascending: false })

    if (error) {
      console.error('[SensitiveWordValidator] Error loading sensitive words:', error)
      throw error
    }

    return data?.map(item => item.word) || []
  }

  /**
   * 获取默认敏感词（作为后备）
   */
  private static getDefaultSensitiveWords(): string[] {
    return [
      'test', 'test123', '123456', 'password', 'admin', 'user', 'guest',
      'demo', 'sample', 'example', 'fake', 'invalid', 'expired', 'used',
      'spam', 'scam', 'fraud', 'virus', 'malware', 'hack', 'crack'
    ]
  }

  /**
   * 验证邀请码是否包含敏感词
   * @param inviteCode 要验证的邀请码
   * @returns 验证结果
   */
  static async validateInviteCode(inviteCode: string): Promise<{
    isValid: boolean
    reason?: string
    matchedWords?: string[]
  }> {
    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize()
    }

    const code = inviteCode.toLowerCase().trim()
    const matchedWords: string[] = []

    // 🔒 首先检查字符类型：只允许英文字母和数字
    const characterValidation = this.validateCharacterTypes(inviteCode)
    if (!characterValidation.isValid) {
      return {
        isValid: false,
        reason: characterValidation.reason,
        matchedWords: ['invalid_characters']
      }
    }

    // 检查是否包含敏感词
    for (const sensitiveWord of this.sensitiveWords) {
      if (code.includes(sensitiveWord)) {
        matchedWords.push(sensitiveWord)
      }
    }

    // 检查常见垃圾模式
    const spamPatterns = this.checkSpamPatterns(code)
    if (spamPatterns.length > 0) {
      matchedWords.push(...spamPatterns)
    }

    if (matchedWords.length > 0) {
      return {
        isValid: false,
        reason: `邀请码包含敏感词: ${matchedWords.join(', ')}`,
        matchedWords
      }
    }

    return {
      isValid: true
    }
  }

  /**
   * 验证字符类型和长度：只允许英文字母和数字，最大20个字符
   */
  private static validateCharacterTypes(code: string): {
    isValid: boolean
    reason?: string
  } {
    // 检查长度限制
    if (code.length === 0) {
      return {
        isValid: false,
        reason: '邀请码不能为空'
      }
    }

    if (code.length > 20) {
      return {
        isValid: false,
        reason: `邀请码长度不能超过20个字符，当前长度: ${code.length}`
      }
    }

    // 检查是否只包含英文字母和数字
    const allowedPattern = /^[a-zA-Z0-9]+$/
    
    if (!allowedPattern.test(code)) {
      // 找出不允许的字符
      const invalidChars = code.match(/[^a-zA-Z0-9]/g)
      if (invalidChars) {
        const uniqueInvalidChars = Array.from(new Set(invalidChars))
        return {
          isValid: false,
          reason: `邀请码只能包含英文字母和数字，不允许使用: ${uniqueInvalidChars.join(', ')}`
        }
      }
    }

    return {
      isValid: true
    }
  }

  /**
   * 检查垃圾模式
   */
  private static checkSpamPatterns(code: string): string[] {
    const patterns: string[] = []

    // 检查重复字符模式 (如 aaaa, 1111)
    const repeatPattern = /(.)\1{3,}/
    if (repeatPattern.test(code)) {
      patterns.push('重复字符模式')
    }

    // 检查连续数字模式 (如 1234, 5678)
    const sequentialPattern = /(?:0123|1234|2345|3456|4567|5678|6789|7890|9876|8765|7654|6543|5432|4321|3210)/
    if (sequentialPattern.test(code)) {
      patterns.push('连续数字模式')
    }

    // 检查纯数字且长度过短 (小于4位)
    const shortNumberPattern = /^\d{1,3}$/
    if (shortNumberPattern.test(code)) {
      patterns.push('过短数字')
    }

    // 检查纯字母且长度过短 (小于4位)
    const shortLetterPattern = /^[a-zA-Z]{1,3}$/
    if (shortLetterPattern.test(code)) {
      patterns.push('过短字母')
    }

    // 检查常见键盘模式
    const keyboardPatterns = ['qwer', 'asdf', 'zxcv', 'qaz', 'wsx', 'edc', 'rfv', 'tgb', 'yhn', 'ujm']
    for (const pattern of keyboardPatterns) {
      if (code.includes(pattern)) {
        patterns.push('键盘模式')
        break
      }
    }

    return patterns
  }

  /**
   * 获取敏感词统计信息
   */
  static async getStats(): Promise<{
    totalWords: number
    activeWords: number
    wordTypes: Record<string, number>
  }> {
    try {
      const supabase = sora2DataManager.getSupabaseClient()
      if (!supabase) {
        throw new Error('Sora2DataManager not initialized')
      }

      const { data, error } = await supabase
        .from('sensitive_words')
        .select('word_type, is_active')

      if (error) {
        console.error('[SensitiveWordValidator] Error getting stats:', error)
        throw error
      }

      const totalWords = data?.length || 0
      const activeWords = data?.filter(item => item.is_active).length || 0
      
      const wordTypes: Record<string, number> = {}
      data?.forEach(item => {
        wordTypes[item.word_type] = (wordTypes[item.word_type] || 0) + 1
      })

      return {
        totalWords,
        activeWords,
        wordTypes
      }
    } catch (error) {
      console.error('[SensitiveWordValidator] Error getting stats:', error)
      return {
        totalWords: this.sensitiveWords.length,
        activeWords: this.sensitiveWords.length,
        wordTypes: { general: this.sensitiveWords.length }
      }
    }
  }

  /**
   * 添加新的敏感词
   */
  static async addSensitiveWord(word: string, wordType: string = 'general', severityLevel: number = 1): Promise<boolean> {
    try {
      const supabase = sora2DataManager.getSupabaseClient()
      if (!supabase) {
        throw new Error('Sora2DataManager not initialized')
      }

      const { error } = await supabase
        .from('sensitive_words')
        .insert({
          word: word.toLowerCase().trim(),
          word_type: wordType,
          severity_level: severityLevel,
          is_active: true
        })

      if (error) {
        console.error('[SensitiveWordValidator] Error adding sensitive word:', error)
        return false
      }

      // 重新初始化敏感词列表
      this.isInitialized = false
      await this.initialize()

      console.log(`[SensitiveWordValidator] ✅ Added sensitive word: ${word}`)
      return true
    } catch (error) {
      console.error('[SensitiveWordValidator] Error adding sensitive word:', error)
      return false
    }
  }
}

// 导出单例实例
export const sensitiveWordValidator = SensitiveWordValidator
