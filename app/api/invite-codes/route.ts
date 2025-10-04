import { NextRequest, NextResponse } from 'next/server'
import { initializeData, inviteCodes, addInviteCode } from '@/lib/data'
import { sensitiveWordValidator } from '@/lib/sensitiveWordValidator'

export async function GET() {
  try {
    // 确保数据已初始化
    await initializeData()
    
    return NextResponse.json(inviteCodes.filter(code => code.status === 'active'))
  } catch (error) {
    console.error('Error fetching invite codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 确保数据已初始化
    await initializeData()
    
    const { code, submitterName } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    // 🔒 敏感词验证
    const validation = await sensitiveWordValidator.validateInviteCode(code)
    if (!validation.isValid) {
      console.log(`[InviteCode] ❌ Rejected invite code "${code}": ${validation.reason}`)
      return NextResponse.json({ 
        error: '邀请码包含不当内容，请提交有效的 Sora 2 邀请码',
        reason: validation.reason,
        matchedWords: validation.matchedWords
      }, { status: 400 })
    }

    // 检查是否已存在相同的邀请码
    const existingCode = inviteCodes.find(c => c.code === code)
    if (existingCode) {
      return NextResponse.json({ error: 'This invite code already exists' }, { status: 409 })
    }

    // 添加新的邀请码
    const newCode = addInviteCode(code, submitterName || 'Anonymous')
    
    return NextResponse.json(newCode, { status: 201 })
  } catch (error) {
    console.error('Error adding invite code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}