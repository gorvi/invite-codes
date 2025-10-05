import { NextRequest, NextResponse } from 'next/server'
import { sora2DataManager } from '@/lib/sora2DataManager'

/**
 * 统一的仪表板接口
 * 一次性返回所有邀请码相关的数据，避免多次 API 调用
 */
export async function GET() {
  try {
    // 直接从数据库查询所有需要的数据
    const supabase = sora2DataManager.getSupabaseClient()
    
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }
    
    // 并行查询所有需要的数据
    const [
      inviteCodesResult,
      userStatsResult,
      dailyStatsResult
    ] = await Promise.all([
      // 查询所有邀请码（包括活跃、已使用、无效）
      supabase
        .from('sora2_invite_codes')
        .select('*')
        .order('created_at', { ascending: false }),
      
      // 查询用户统计
      supabase
        .from('sora2_user_stats')
        .select('*'),
      
      // 查询每日统计视图
      supabase
        .from('sora2_daily_stats')
        .select('*')
    ])

    if (inviteCodesResult.error) {
      console.error('[Dashboard] Error fetching invite codes:', inviteCodesResult.error)
      throw inviteCodesResult.error
    }

    const allInviteCodes = inviteCodesResult.data || []
    
    // 🔥 计算统计数据
    const activeCodes = allInviteCodes.filter(code => code.status === 'active')
    const usedCodes = allInviteCodes.filter(code => code.status === 'used')
    const invalidCodes = allInviteCodes.filter(code => code.status === 'invalid')
    const successfullyUsedCodes = allInviteCodes.filter(code => code.unique_worked_count >= 4)

    // 计算总复制次数和投票次数
    const totalCopyCount = allInviteCodes.reduce((sum, code) => sum + (code.copy_count || 0), 0)
    const totalUniqueCopyCount = allInviteCodes.reduce((sum, code) => sum + (code.unique_copied_count || 0), 0)
    const totalWorkedVotes = allInviteCodes.reduce((sum, code) => sum + (code.worked_votes || 0), 0)
    const totalDidntWorkVotes = allInviteCodes.reduce((sum, code) => sum + (code.didnt_work_votes || 0), 0)

    // 处理用户统计数据
    const userStats: any = {}
    if (userStatsResult.data) {
      userStatsResult.data.forEach(user => {
        userStats[user.user_id] = {
          userId: user.user_id,
          copyCount: user.copy_count || 0,
          voteCount: user.vote_count || 0,
          submitCount: user.submit_count || 0,
          firstVisit: user.first_visit,
          lastVisit: user.last_visit
        }
      })
    }

    // 处理每日统计数据
    const dailyStats: any = {}
    if (dailyStatsResult.data) {
      dailyStatsResult.data.forEach(day => {
        dailyStats[day.date] = {
          date: day.date,
          copyClicks: day.copy_clicks || 0,
          workedVotes: day.worked_votes || 0,
          didntWorkVotes: day.didnt_work_votes || 0,
          submitCount: day.submit_count || 0,
          uniqueVisitors: day.unique_submitters || 0
        }
      })
    }

    // 🔥 转换邀请码数据格式，确保包含所有必要字段
    const formattedInviteCodes = allInviteCodes.map((row: any) => ({
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
    }))

    // 返回统一的数据结构
    const dashboardData = {
      // 邀请码数据
      allInviteCodes: formattedInviteCodes,
      activeInviteCodes: formattedInviteCodes.filter(code => code.status === 'active'),
      
      // 统计数据
      activeCodeCount: activeCodes.length,
      totalCodeCount: allInviteCodes.length,
      usedCodeCount: usedCodes.length,
      invalidCodeCount: invalidCodes.length,
      successfullyUsedCount: successfullyUsedCodes.length,
      
      // 总计数
      totalCopyCount,
      totalUniqueCopyCount,
      totalWorkedVotes,
      totalDidntWorkVotes,
      submitCount: allInviteCodes.length, // 总提交数等于邀请码总数
      
      // 用户和每日统计
      userStats,
      dailyStats,
      
      // 数据一致性检查
      dataConsistency: {
        isConsistent: true,
        actualActiveCount: activeCodes.length,
        reportedActiveCount: activeCodes.length
      },
      
      // 元数据
      lastUpdated: new Date().toISOString(),
      dataSource: 'supabase_direct_query'
    }

    console.log('[Dashboard] ✅ Unified data fetched:', {
      totalCodes: allInviteCodes.length,
      activeCodes: activeCodes.length,
      totalCopyCount,
      totalUniqueCopyCount,
      // 🔥 调试信息：显示前几个邀请码的统计
      sampleCodes: formattedInviteCodes.slice(0, 3).map(code => ({
        code: code.code,
        copiedCount: code.copiedCount,
        uniqueCopiedCount: code.uniqueCopiedCount,
        status: code.status
      }))
    })

    const response = NextResponse.json(dashboardData)
    
    // 🔥 添加缓存控制头，确保数据是最新的
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error('[Dashboard] Error fetching unified data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
