import { NextRequest, NextResponse } from 'next/server'
import { sora2DataManager } from '@/lib/sora2DataManager'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { vote, userId } = body // 'worked' or 'didntWork', 以及 userId
    const { id } = params

    if (!vote || !['worked', 'didntWork'].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      )
    }

    // 生成或获取用户ID
    const userIdentifier = userId || generateUserIdentifier(request)

    // 获取 Supabase 客户端
    const supabase = sora2DataManager.getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // 获取当前邀请码数据
    const { data: currentCode, error: fetchError } = await supabase
      .from('sora2_invite_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentCode) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      )
    }

    // 准备更新数据
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // 更新投票数据
    if (vote === 'worked') {
      updates.worked_votes = (currentCode.worked_votes || 0) + 1
    } else {
      updates.didnt_work_votes = (currentCode.didnt_work_votes || 0) + 1
    }

    // 检查用户是否已经投票过（使用唯一用户投票统计）
    const { data: existingVotes } = await supabase
      .from('sora2_unique_vote_stats')
      .select('*')
      .eq('code_id', id)
      .eq('user_id', userIdentifier)
      .eq('vote_type', vote)
      .single()

    // 如果是新的唯一用户投票，更新唯一投票计数
    if (!existingVotes) {
      // 插入唯一投票记录
      await supabase
        .from('sora2_unique_vote_stats')
        .insert({
          code_id: id,
          user_id: userIdentifier,
          vote_type: vote,
          created_at: new Date().toISOString()
        })

      // 更新唯一投票计数
      if (vote === 'worked') {
        updates.unique_worked_count = (currentCode.unique_worked_count || 0) + 1
      } else {
        updates.unique_didnt_work_count = (currentCode.unique_didnt_work_count || 0) + 1
      }
    }

    // 检查邀请码状态逻辑
    const newUniqueWorked = vote === 'worked' && !existingVotes 
      ? (currentCode.unique_worked_count || 0) + 1 
      : (currentCode.unique_worked_count || 0)
    const newUniqueDidntWork = vote === 'didntWork' && !existingVotes 
      ? (currentCode.unique_didnt_work_count || 0) + 1 
      : (currentCode.unique_didnt_work_count || 0)

    if (newUniqueWorked >= 4) {
      updates.status = 'used'
    } else if (vote === 'didntWork' && 
               newUniqueDidntWork > newUniqueWorked && 
               newUniqueWorked >= 2) {
      updates.status = 'invalid'
    }

    // 更新邀请码数据
    const { data: updatedCode, error: updateError } = await supabase
      .from('sora2_invite_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Vote] Failed to update invite code:', updateError)
      return NextResponse.json(
        { error: 'Failed to update invite code' },
        { status: 500 }
      )
    }

    // 更新用户统计
    const { data: existingUserStats } = await supabase
      .from('sora2_user_stats')
      .select('vote_count')
      .eq('user_id', userIdentifier)
      .single()

    await supabase
      .from('sora2_user_stats')
      .upsert({
        user_id: userIdentifier,
        vote_count: (existingUserStats?.vote_count || 0) + 1,
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      })

    // 更新每日统计
    const today = new Date().toISOString().split('T')[0]
    const { data: existingDailyStats } = await supabase
      .from('sora2_daily_stats')
      .select('worked_votes, didnt_work_votes')
      .eq('date', today)
      .single()

    const currentWorkedVotes = existingDailyStats?.worked_votes || 0
    const currentDidntWorkVotes = existingDailyStats?.didnt_work_votes || 0

    await supabase
      .from('sora2_daily_stats')
      .upsert({
        date: today,
        worked_votes: vote === 'worked' ? currentWorkedVotes + 1 : currentWorkedVotes,
        didnt_work_votes: vote === 'didntWork' ? currentDidntWorkVotes + 1 : currentDidntWorkVotes,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'date' 
      })

    // 返回更新后的邀请码数据
    const responseData = {
      id: updatedCode.id,
      code: updatedCode.code,
      createdAt: updatedCode.created_at,
      status: updatedCode.status,
      votes: {
        worked: updatedCode.worked_votes || 0,
        didntWork: updatedCode.didnt_work_votes || 0,
        uniqueWorked: updatedCode.unique_worked_count || 0,
        uniqueDidntWork: updatedCode.unique_didnt_work_count || 0
      },
      copiedCount: updatedCode.copy_count || 0,
      uniqueCopiedCount: updatedCode.unique_copied_count || 0
    }

    console.log(`[Vote] ✅ Vote recorded: ${vote} for code ${updatedCode.code}`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('[Vote] Error:', error)
    return NextResponse.json(
      { error: 'Failed to vote on invite code' },
      { status: 500 }
    )
  }
}

// 生成用户标识符（基于IP和User-Agent）
function generateUserIdentifier(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) // 按天分组
  
  // 创建一个简单的哈希标识符
  const combined = `${ip}-${userAgent}-${timestamp}`
  return Buffer.from(combined).toString('base64').substring(0, 16)
}

