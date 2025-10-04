import { NextRequest, NextResponse } from 'next/server'
import { sensitiveWordValidator } from '@/lib/sensitiveWordValidator'

/**
 * POST /api/sensitive-words/validate
 * 验证文本是否包含敏感词
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text parameter' },
        { status: 400 }
      )
    }

    const validation = await sensitiveWordValidator.validateInviteCode(text)
    
    return NextResponse.json({
      success: true,
      validation
    })
  } catch (error) {
    console.error('[SensitiveWords Validate API] Error validating text:', error)
    return NextResponse.json(
      { error: 'Failed to validate text' },
      { status: 500 }
    )
  }
}
