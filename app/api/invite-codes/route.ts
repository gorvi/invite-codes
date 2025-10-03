import { NextRequest, NextResponse } from 'next/server'
import { inviteCodes, addInviteCode } from '@/lib/data'

export async function GET() {
  return NextResponse.json(inviteCodes.filter(code => code.status === 'active'))
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { code, submitterName } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
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