import { NextRequest, NextResponse } from 'next/server'
import { gameDataManager } from '@/lib/gameDataManager'

export async function GET() {
  try {
    const gameAnalytics = await gameDataManager.getGameAnalytics()
    
    if (!gameAnalytics) {
      return NextResponse.json(
        { error: 'Failed to fetch game stats' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      globalBestScore: gameAnalytics.global_best_score || 0,
      totalGamesPlayed: gameAnalytics.total_games_played || 0,
      totalHamstersWhacked: gameAnalytics.total_hamsters_whacked || 0,
      totalPlayers: gameAnalytics.total_players || 0,
    })
  } catch (error) {
    console.error('[GameStats API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, score, hamstersWhacked, userId, level, gameDuration } = body

    switch (action) {
      case 'submit_score':
        if (typeof score === 'number' && score > 0 && userId) {
          console.log(`[Game] Submitting score: ${score} for user: ${userId}`)
          
          // 1. 保存游戏分数记录到 game_scores 表
          const gameScore = await gameDataManager.saveGameScore({
            userId,
            score,
            level: level || 1,
            hamstersWhacked: hamstersWhacked || 0,
            gameDuration: gameDuration || 0
          })

          if (!gameScore) {
            console.error('[Game] Failed to save game score')
            return NextResponse.json(
              { error: 'Failed to save game score' },
              { status: 500 }
            )
          }

          // 2. 获取用户统计
          const userStats = await gameDataManager.getUserStats(userId)

          // 3. 更新用户统计
          const userUpdates: any = {
            totalGamesPlayed: (userStats?.totalGamesPlayed || 0) + 1,
            totalHamstersWhacked: (userStats?.totalHamstersWhacked || 0) + (hamstersWhacked || 0),
            totalPlayTime: (userStats?.totalPlayTime || 0) + (gameDuration || 0)
          }

          // 检查是否刷新个人最佳分数
          if (!userStats || score > userStats.personalBestScore) {
            userUpdates.personalBestScore = score
            console.log(`[Game] 🏆 New personal best score for user ${userId}: ${score}`)
          }

          const updatedUserStats = await gameDataManager.updateUserStats(userId, userUpdates)
          if (!updatedUserStats) {
            console.error('[Game] Failed to update user stats')
            return NextResponse.json(
              { error: 'Failed to update user stats' },
              { status: 500 }
            )
          }

          // 4. 获取最新的全局统计（从视图实时计算）
          const latestAnalytics = await gameDataManager.getGameAnalytics()

          console.log('[Game] ✅ Game data saved successfully')

          return NextResponse.json({
            success: true,
            globalBestScore: latestAnalytics?.global_best_score || 0,
            totalGamesPlayed: latestAnalytics?.total_games_played || 0,
            totalHamstersWhacked: latestAnalytics?.total_hamsters_whacked || 0,
            totalPlayers: latestAnalytics?.total_players || 0,
            personalBestScore: updatedUserStats.personalBestScore,
            gameScoreId: gameScore.id
          })
        } else {
          return NextResponse.json(
            { error: 'Invalid score data' },
            { status: 400 }
          )
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[GameStats API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update game stats' },
      { status: 500 }
    )
  }
}

