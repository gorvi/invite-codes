import { NextRequest, NextResponse } from 'next/server'
import { sensitiveWordValidator } from '@/lib/sensitiveWordValidator'

/**
 * GET /api/sensitive-words
 * 获取敏感词统计信息
 */
export async function GET() {
  try {
    const stats = await sensitiveWordValidator.getStats()
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('[SensitiveWords API] Error getting stats:', error)
    return NextResponse.json(
      { error: 'Failed to get sensitive words stats' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sensitive-words
 * 添加新的敏感词
 */
export async function POST(request: NextRequest) {
  try {
    const { word, wordType = 'general', severityLevel = 1 } = await request.json()
    
    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Invalid word parameter' },
        { status: 400 }
      )
    }

    const success = await sensitiveWordValidator.addSensitiveWord(word, wordType, severityLevel)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully added sensitive word: ${word}`
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to add sensitive word' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[SensitiveWords API] Error adding sensitive word:', error)
    return NextResponse.json(
      { error: 'Failed to add sensitive word' },
      { status: 500 }
    )
  }
}

