import { NextRequest, NextResponse } from 'next/server'
import { sora2DataManager } from '@/lib/sora2DataManager'

// GET 方法已移至 /api/dashboard，这里只保留 POST 方法用于记录用户操作

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, inviteCodeId, userId } = body

    // 生成或获取用户ID
    const userIdentifier = userId || generateUserIdentifier(request)

    // 从 Supabase 数据库获取邀请码数据
    const supabase = sora2DataManager.getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // 获取用户统计
    const { data: userStats, error: userStatsError } = await supabase
      .from('sora2_user_stats')
      .select('*')
      .eq('user_id', userIdentifier)
      .single()

    if (action === 'copy' && inviteCodeId) {
      // 获取邀请码数据
      const { data: inviteCodeData, error: fetchError } = await supabase
        .from('sora2_invite_codes')
        .select('*')
        .eq('id', inviteCodeId)
        .single()

      if (fetchError || !inviteCodeData) {
        return NextResponse.json(
          { error: 'Invite code not found' },
          { status: 404 }
        )
      }

      // 更新复制统计
      let newCopyCount = (inviteCodeData.copy_count || 0) + 1
      let newUniqueCopiedCount = inviteCodeData.unique_copied_count || 0
      let copiedUserIds = inviteCodeData.copied_user_ids || []

      // 检查是否是新的独立用户复制
      if (!copiedUserIds.includes(userIdentifier)) {
        copiedUserIds.push(userIdentifier)
        newUniqueCopiedCount += 1
      }

      // 更新邀请码数据
      const { error: updateError } = await supabase
        .from('sora2_invite_codes')
        .update({
          copy_count: newCopyCount,
          unique_copied_count: newUniqueCopiedCount,
          copied_user_ids: copiedUserIds
        })
        .eq('id', inviteCodeId)

      if (updateError) {
        console.error('[Copy] Failed to update invite code:', updateError)
        return NextResponse.json(
          { error: 'Failed to update copy count' },
          { status: 500 }
        )
      }

      // 更新用户统计
      if (userStats) {
        await supabase
          .from('sora2_user_stats')
          .update({
            copy_count: (userStats.copy_count || 0) + 1,
            last_visit: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userIdentifier)
      } else {
        // 创建新用户统计
        await supabase.from('sora2_user_stats').insert({
          user_id: userIdentifier,
          copy_count: 1,
          vote_count: 0,
          submit_count: 0,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      console.log(`[Copy] Copy recorded successfully: code ${inviteCodeData.code}, user ${userIdentifier}`)

      return NextResponse.json({ 
        success: true, 
        action, 
        timestamp: new Date().toISOString(),
        userId: userIdentifier,
        totalCopies: newCopyCount,
        uniqueCopies: newUniqueCopiedCount
      })
    }

    // 对于其他操作，只更新用户统计
    if (userStats) {
      await supabase
        .from('sora2_user_stats')
        .update({
          last_visit: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userIdentifier)
    } else {
      // 创建新用户统计
      await supabase.from('sora2_user_stats').insert({
        user_id: userIdentifier,
        copy_count: 0,
        vote_count: 0,
        submit_count: 0,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      action, 
      timestamp: new Date().toISOString(),
      userId: userIdentifier
    })
    
  } catch (error) {
    console.error('Error recording analytics event:', error)
    return NextResponse.json(
      { error: 'Failed to record analytics event' },
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
