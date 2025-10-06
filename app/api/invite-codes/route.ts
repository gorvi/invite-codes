import { NextRequest, NextResponse } from 'next/server'
import { sora2DataManager } from '@/lib/sora2DataManager'
import { sensitiveWordValidator } from '@/lib/sensitiveWordValidator'

export async function GET() {
  try {
    const supabase = sora2DataManager.getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data: inviteCodes, error } = await supabase
      .from('sora2_invite_codes')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const formattedCodes = inviteCodes?.map((row: any) => ({
      id: row.id,
      code: row.code,
      createdAt: new Date(row.created_at),
      status: row.status,
      votes: {
        worked: row.worked_votes || 0,
        didntWork: row.didnt_work_votes || 0,
        uniqueWorked: row.unique_worked_count || 0,
        uniqueDidntWork: row.unique_didnt_work_count || 0
      },
      copiedCount: row.copy_count || 0,
      uniqueCopiedCount: row.unique_copied_count || 0
    })) || []

    return NextResponse.json(formattedCodes)
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
    const supabase = sora2DataManager.getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    const { code, submitterName } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    // Validate against sensitive words
    const validation = await sensitiveWordValidator.validateInviteCode(code)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid invite code content. Please submit a valid Sora 2 invite code.',
        reason: validation.reason,
        matchedWords: validation.matchedWords
      }, { status: 400 })
    }

    // 检查是否已存在相同的邀请码
    const { data: existingCodes } = await supabase
      .from('sora2_invite_codes')
      .select('id')
      .eq('code', code)
      .limit(1)

    if (existingCodes && existingCodes.length > 0) {
      return NextResponse.json({ error: 'This invite code already exists' }, { status: 409 })
    }

    // 添加新的邀请码到 Supabase
    const { data: newCode, error } = await supabase
      .from('sora2_invite_codes')
      .insert({
        code: code,
        status: 'active',
        submitter_name: submitterName || 'Anonymous',
        worked_votes: 0,
        didnt_work_votes: 0,
        unique_worked_count: 0,
        unique_didnt_work_count: 0,
        copy_count: 0,
        unique_copied_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // 格式化返回数据
    const formattedCode = {
      id: newCode.id,
      code: newCode.code,
      createdAt: new Date(newCode.created_at),
      status: newCode.status,
      votes: {
        worked: newCode.worked_votes || 0,
        didntWork: newCode.didnt_work_votes || 0,
        uniqueWorked: newCode.unique_worked_count || 0,
        uniqueDidntWork: newCode.unique_didnt_work_count || 0
      },
      copiedCount: newCode.copy_count || 0,
      uniqueCopiedCount: newCode.unique_copied_count || 0
    }
    
    return NextResponse.json(formattedCode, { status: 201 })
  } catch (error) {
    console.error('Error adding invite code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}