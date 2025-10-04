import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Copy, ThumbsUp, ThumbsDown, Clock, User, CheckCircle, XCircle } from 'lucide-react'
import { InviteCode } from '@/lib/data'
import CopyDetection from '@/lib/copyDetection'

interface InviteCodeDisplayProps {
  codes: InviteCode[]
  onVote: (id: string, type: 'worked' | 'didntWork') => Promise<void>
  onCopy: (code: string, codeId: string) => Promise<void>
}

export default function InviteCodeDisplay({ codes, onVote, onCopy }: InviteCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [lastClickTimes, setLastClickTimes] = useState<{[key: string]: number}>({})
  const copyDetectionRef = useRef<CopyDetection | null>(null)

  const canClick = (buttonKey: string): boolean => {
    const now = Date.now()
    const lastClick = lastClickTimes[buttonKey] || 0
    const timeDiff = now - lastClick
    if (timeDiff < 1000) {
      console.log(`[Debounce] Button "${buttonKey}" clicked too fast. Wait ${1000 - timeDiff}ms`)
      return false
    }
    return true
  }

  const updateClickTime = (buttonKey: string) => {
    setLastClickTimes(prev => ({ ...prev, [buttonKey]: Date.now() }))
  }

  // 🔥 初始化复制检测
  useEffect(() => {
    if (!copyDetectionRef.current) {
      copyDetectionRef.current = new CopyDetection({
        onDetect: async (copiedText: string, codeId: string) => {
          console.log('[InviteCodeDisplay] Auto-detected copy:', { copiedText, codeId })
          // 自动记录复制行为
          await onCopy(copiedText, codeId)
          setCopiedCode(copiedText)
          setTimeout(() => setCopiedCode(null), 2000)
        }
      })
      copyDetectionRef.current.startListening()
    }

    return () => {
      if (copyDetectionRef.current) {
        copyDetectionRef.current.stopListening()
      }
    }
  }, [onCopy])

  const handleCopyCode = async (code: string, codeId: string) => {
    const buttonKey = `copy-${codeId}`
    if (!canClick(buttonKey)) {
      console.log(`[Copy] Debounce: Please wait before copying again`)
      return
    }
    updateClickTime(buttonKey)
    
    try {
      // 立即设置复制状态，提供即时反馈
      setCopiedCode(code)
      
      // 调用复制函数（包含剪贴板操作和 API 调用）
      await onCopy(code, codeId)
      
      // 2秒后清除复制状态
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
      // 如果复制失败，立即清除复制状态
      setCopiedCode(null)
    }
  }

  const handleVote = async (id: string, type: 'worked' | 'didntWork') => {
    const buttonKey = `${type}-${id}`
    if (!canClick(buttonKey)) {
      console.log(`[Vote] Debounce: Please wait before voting again`)
      return
    }
    updateClickTime(buttonKey)
    
    try {
      await onVote(id, type)
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const calculateLastCodeTime = (code: InviteCode) => {
    const now = new Date()
    const createdAt = new Date(code.createdAt)
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getStatusIcon = (code: InviteCode) => {
    if (code.status === 'active') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (code.status === 'used') {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (code: InviteCode) => {
    if (code.status === 'active') return 'Available'
    if (code.status === 'used') return 'Used'
    return 'Expired'
  }

  const getStatusColor = (code: InviteCode) => {
    if (code.status === 'active') return 'text-green-600 bg-green-50'
    if (code.status === 'used') return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (codes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-500 mb-4">
          <Copy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg">No available Sora 2 codes</p>
          <p className="text-sm mt-2">Please try again later, or submit a new Sora 2 invite code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {codes.map((code) => (
        <div key={code.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(code)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(code)}`}>
                    {getStatusText(code)}
                  </span>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{calculateLastCodeTime(code)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <code 
                    className="text-lg font-mono font-bold text-gray-900 break-all"
                    data-invite-code="true"
                    data-invite-code-id={code.id}
                    data-invite-code-text={code.code}
                  >
                    {code.code}
                  </code>
                </div>
              </div>
            </div>

            {/* 操作按钮行 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Copy Code 按钮 */}
              <button
                onClick={() => handleCopyCode(code.code, code.id)}
                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                  copiedCode === code.code
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {copiedCode === code.code ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">Copy Code</span>
                  </>
                )}
              </button>

              {/* Worked 按钮 */}
              <button
                onClick={() => handleVote(code.id, 'worked')}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                title="This invite code worked"
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm font-medium">Worked</span>
              </button>

              {/* Didn't Work 按钮 */}
              <button
                onClick={() => handleVote(code.id, 'didntWork')}
                className="flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                title="This invite code didn't work"
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="text-sm font-medium">Didn't Work</span>
              </button>
            </div>

            {/* 简洁统计行 */}
            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Copy className="h-3 w-3" />
                  <span>{code.uniqueCopiedCount || 0} copied</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{code.votes.uniqueWorked || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{code.votes.uniqueDidntWork || 0}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Success rate: {code.votes.uniqueWorked > 0 || code.votes.uniqueDidntWork > 0 
                  ? `${Math.round((code.votes.uniqueWorked / (code.votes.uniqueWorked + code.votes.uniqueDidntWork)) * 100)}%`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}