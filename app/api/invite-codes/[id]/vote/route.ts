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

    // 从 Supabase 数据库获取邀请码
    const supabase = sora2DataManager.getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // 获取邀请码数据
    const { data: inviteCodeData, error: fetchError } = await supabase
      .from('sora2_invite_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !inviteCodeData) {
      return NextResponse.json(
        { error: 'Invite code not found' },
        { status: 404 }
      )
    }

    // 生成或获取用户ID
    const userIdentifier = userId || generateUserIdentifier(request)

    // 获取用户统计
    const { data: userStats, error: userStatsError } = await supabase
      .from('sora2_user_stats')
      .select('*')
      .eq('user_id', userIdentifier)
      .single()

    // 更新投票数据 - 使用现有的数据库结构
    let newWorkedVotes = inviteCodeData.worked_votes || 0
    let newDidntWorkVotes = inviteCodeData.didnt_work_votes || 0
    let newUniqueWorkedVotes = inviteCodeData.unique_worked_count || 0
    let newUniqueDidntWorkVotes = inviteCodeData.unique_didnt_work_count || 0
    let newStatus = inviteCodeData.status || 'active'

    // 获取现有的用户ID列表
    let workedUserIds = inviteCodeData.worked_user_ids || []
    let didntWorkUserIds = inviteCodeData.didnt_work_user_ids || []

    // 检查是否是新用户投票
    if (vote === 'worked') {
      newWorkedVotes += 1
      // 检查是否是新的独立用户投票
      if (!workedUserIds.includes(userIdentifier)) {
        workedUserIds.push(userIdentifier)
        newUniqueWorkedVotes += 1
      }
    } else { // vote === 'didntWork'
      newDidntWorkVotes += 1
      // 检查是否是新的独立用户投票
      if (!didntWorkUserIds.includes(userIdentifier)) {
        didntWorkUserIds.push(userIdentifier)
        newUniqueDidntWorkVotes += 1
      }
    }

    // 检查邀请码状态逻辑
    if (newUniqueWorkedVotes >= 4) {
      newStatus = 'used'
    } else if (vote === 'didntWork' && 
               newUniqueDidntWorkVotes > newUniqueWorkedVotes && 
               newUniqueWorkedVotes >= 2) {
      newStatus = 'invalid'
    }

    // 更新邀请码数据
    const { data: updatedInviteCode, error: updateError } = await supabase
      .from('sora2_invite_codes')
      .update({
        worked_votes: newWorkedVotes,
        didnt_work_votes: newDidntWorkVotes,
        unique_worked_count: newUniqueWorkedVotes,
        unique_didnt_work_count: newUniqueDidntWorkVotes,
        worked_user_ids: workedUserIds,
        didnt_work_user_ids: didntWorkUserIds,
        status: newStatus
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[Vote] Failed to update invite code:', updateError)
      return NextResponse.json(
        { error: 'Failed to update vote' },
        { status: 500 }
      )
    }

    // 更新用户统计
    if (userStats) {
      await supabase
        .from('sora2_user_stats')
        .update({
          vote_count: (userStats.vote_count || 0) + 1,
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userIdentifier)
    } else {
      // 创建新用户统计
      await supabase.from('sora2_user_stats').insert({
        user_id: userIdentifier,
        vote_count: 1,
        copy_count: 0,
        submit_count: 0,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    console.log(`[Vote] Vote recorded successfully: ${vote} for code ${id}`)

    // 构造返回数据
    const responseData = {
      id: updatedInviteCode.id,
      code: updatedInviteCode.code,
      status: updatedInviteCode.status,
      createdAt: updatedInviteCode.created_at,
      votes: {
        worked: newWorkedVotes,
        didntWork: newDidntWorkVotes,
        uniqueWorked: newUniqueWorkedVotes,
        uniqueDidntWork: newUniqueDidntWorkVotes
      },
      copiedCount: updatedInviteCode.copy_count || 0,
      uniqueCopiedCount: updatedInviteCode.unique_copied_count || 0
    }

    return NextResponse.json(responseData)
  } catch (error) {
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

