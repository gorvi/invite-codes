'use client'

import { useState } from 'react'

export default function TestSensitiveWordsPage() {
  const [testCode, setTestCode] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    if (!testCode.trim()) {
      alert('请输入要测试的邀请码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sensitive-words/validate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testCode }),
      })

      const data = await response.json()
      setValidationResult(data.validation)
    } catch (error) {
      console.error('Error validating:', error)
      setValidationResult({ isValid: false, reason: '验证失败' })
    } finally {
      setLoading(false)
    }
  }

  const testCodes = [
    'test123',
    'fake',
    'invalid',
    'aaaa',
    '123456',
    'admin',
    'MFW49D',
    'REALCODE',
    'VALID123'
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">敏感词过滤测试</h1>
        
        {/* 测试输入 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试邀请码</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="输入要测试的邀请码..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleValidate}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '验证中...' : '验证'}
            </button>
          </div>
        </div>

        {/* 验证结果 */}
        {validationResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">验证结果</h2>
            <div className={`p-4 rounded-lg ${
              validationResult.isValid 
                ? 'bg-green-100 border border-green-300' 
                : 'bg-red-100 border border-red-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg font-semibold ${
                  validationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.isValid ? '✅ 通过' : '❌ 拒绝'}
                </span>
              </div>
              {validationResult.reason && (
                <p className={`text-sm ${
                  validationResult.isValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationResult.reason}
                </p>
              )}
              {validationResult.matchedWords && validationResult.matchedWords.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700">匹配的敏感词:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {validationResult.matchedWords.map((word: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 快速测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">快速测试</h2>
          <div className="grid grid-cols-3 gap-4">
            {testCodes.map((code, index) => (
              <button
                key={index}
                onClick={() => setTestCode(code)}
                className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <code className="text-sm font-mono">{code}</code>
              </button>
            ))}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">使用说明</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>绿色 ✅</strong>: 邀请码通过验证，可以正常提交</p>
            <p>• <strong>红色 ❌</strong>: 邀请码包含敏感词或被识别为垃圾内容</p>
            <p>• 敏感词包括: 垃圾词汇、虚假模式、恶意内容等</p>
            <p>• 系统会自动检测重复字符、连续数字等垃圾模式</p>
          </div>
        </div>
      </div>
    </div>
  )
}
