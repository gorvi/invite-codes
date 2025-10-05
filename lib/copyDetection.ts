/**
 * 复制检测工具
 * 自动检测用户是否复制了代码，即使没有点击 Copy 按钮
 */

interface CopyDetectionOptions {
  onDetect: (code: string, codeId: string) => void
  debounceMs?: number
}

class CopyDetection {
  private options: CopyDetectionOptions
  private lastClipboardContent = ''
  private debounceTimer: NodeJS.Timeout | null = null
  private isListening = false
  private lastDetectedCode = '' // 防止重复检测同一个代码
  private lastDetectedTime = 0 // 防止短时间内重复检测

  constructor(options: CopyDetectionOptions) {
    this.options = options
  }

  /**
   * 开始监听复制行为
   */
  startListening() {
    if (this.isListening) return

    this.isListening = true
    console.log('[CopyDetection] Starting copy detection')

    // 监听键盘事件 (Ctrl+C, Cmd+C)
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    
    // 监听剪贴板变化
    this.startClipboardMonitoring()
    
    // 监听选择变化
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
  }

  /**
   * 停止监听
   */
  stopListening() {
    if (!this.isListening) return

    this.isListening = false
    console.log('[CopyDetection] Stopping copy detection')

    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this))
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(event: KeyboardEvent) {
    // 检测 Ctrl+C 或 Cmd+C
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      const selectedText = window.getSelection()?.toString().trim()
      if (selectedText) {
        console.log('[CopyDetection] Copy detected via keyboard:', selectedText)
        this.detectCopy(selectedText)
      }
    }
  }

  /**
   * 处理选择变化
   */
  private handleSelectionChange() {
    // 延迟检测，给用户时间完成选择
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    this.debounceTimer = setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim()
        console.log('[CopyDetection] Text selected:', selectedText)
        // 不立即检测，等待可能的复制操作
      }
    }, 100)
  }

  /**
   * 开始监控剪贴板
   */
  private startClipboardMonitoring() {
    // 🔥 初始化时记录当前剪贴板内容，避免页面刷新时误触发
    navigator.clipboard.readText().then(content => {
      this.lastClipboardContent = content || ''
      console.log('[CopyDetection] Initial clipboard content:', this.lastClipboardContent)
    }).catch(() => {
      // 忽略初始化时的剪贴板访问错误
    })

    // 定期检查剪贴板内容
    setInterval(async () => {
      try {
        const clipboardContent = await navigator.clipboard.readText()
        if (clipboardContent && clipboardContent !== this.lastClipboardContent) {
          this.lastClipboardContent = clipboardContent
          console.log('[CopyDetection] Clipboard content changed:', clipboardContent)
          this.detectCopy(clipboardContent)
        }
      } catch (error) {
        // 剪贴板访问可能被拒绝，这是正常的
        // console.log('[CopyDetection] Clipboard access denied')
      }
    }, 1000) // 每秒检查一次
  }

  /**
   * 检测复制行为
   */
  private detectCopy(text: string) {
    const now = Date.now()
    
    // 防止短时间内重复检测（5秒内）
    if (now - this.lastDetectedTime < 5000) {
      return
    }
    
    // 清理文本，移除可能的格式字符
    const cleanText = text.replace(/[^\w]/g, '').toUpperCase()
    
    // 查找页面中的邀请码元素
    const codeElements = document.querySelectorAll('[data-invite-code]')
    
    for (let i = 0; i < codeElements.length; i++) {
      const element = codeElements[i]
      const codeId = element.getAttribute('data-invite-code-id')
      const codeText = element.textContent?.replace(/[^\w]/g, '').toUpperCase()
      
      if (codeText && cleanText.includes(codeText)) {
        // 防止重复检测同一个代码
        if (this.lastDetectedCode === codeText && now - this.lastDetectedTime < 10000) {
          console.log('[CopyDetection] Duplicate copy detection prevented for:', codeText)
          return
        }
        
        console.log('[CopyDetection] Invite code copy detected:', {
          originalText: text,
          cleanText,
          codeText,
          codeId
        })
        
        // 记录检测到的代码和时间
        this.lastDetectedCode = codeText
        this.lastDetectedTime = now
        
        // 🔥 触发用户引导提示
        window.dispatchEvent(new CustomEvent('copyDetected'))
        
        this.options.onDetect(text, codeId || '')
        break
      }
    }
  }

  /**
   * 手动标记元素为邀请码
   */
  static markAsInviteCode(element: HTMLElement, code: string, codeId: string) {
    element.setAttribute('data-invite-code', 'true')
    element.setAttribute('data-invite-code-id', codeId)
    element.setAttribute('data-invite-code-text', code)
  }
}

export default CopyDetection
