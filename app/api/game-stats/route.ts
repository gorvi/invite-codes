import { NextRequest, NextResponse } from 'next/server'
import { initializeData, analyticsData, saveData } from '@/lib/data'

export async function GET() {
  try {
    // 确保数据已初始化
    await initializeData()
    
    return NextResponse.json({
      globalBestScore: analyticsData.gameStats.globalBestScore,
      totalGamesPlayed: analyticsData.gameStats.totalGamesPlayed,
      totalHamstersWhacked: analyticsData.gameStats.totalHamstersWhacked,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 确保数据已初始化
    await initializeData()
    
    const body = await request.json()
    const { action, score, hamstersWhacked, userId } = body

    switch (action) {
      case 'submit_score':
        if (typeof score === 'number' && score > 0) {
          // 更新全球最佳分数（只有更高分数才能覆盖）
          if (score > analyticsData.gameStats.globalBestScore) {
            analyticsData.gameStats.globalBestScore = score
            console.log(`[Game] New global best score: ${score}`)
          }
          
          // 更新用户个人最佳分数（只有更高分数才能覆盖）
          if (userId && typeof userId === 'string') {
            if (!analyticsData.userStats[userId]) {
              analyticsData.userStats[userId] = {
                userId: userId,
                copyCount: 0,
                voteCount: 0,
                submitCount: 0,
                firstVisit: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                personalBestScore: 0
              }
            }
            
            if (score > analyticsData.userStats[userId].personalBestScore) {
              analyticsData.userStats[userId].personalBestScore = score
              analyticsData.userStats[userId].lastVisit = new Date().toISOString()
              console.log(`[Game] New personal best score for user ${userId}: ${score}`)
            }
          }
          
          // 增加游戏次数
          analyticsData.gameStats.totalGamesPlayed += 1
          
          // 增加击中的地鼠数量
          if (typeof hamstersWhacked === 'number' && hamstersWhacked > 0) {
            analyticsData.gameStats.totalHamstersWhacked += hamstersWhacked
          }
          
          // 🔥 使用新的持久化系统保存游戏统计数据
          try {
            await saveData()
            console.log('[Game] Game stats saved to storage')
          } catch (error) {
            console.error('[Game] Failed to save game stats:', error)
          }
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      globalBestScore: analyticsData.gameStats.globalBestScore,
      totalGamesPlayed: analyticsData.gameStats.totalGamesPlayed,
      totalHamstersWhacked: analyticsData.gameStats.totalHamstersWhacked,
      personalBestScore: userId ? (analyticsData.userStats[userId]?.personalBestScore || 0) : 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update game stats' },
      { status: 500 }
    )
  }
}

