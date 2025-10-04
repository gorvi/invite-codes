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
      globalBestScore: gameAnalytics.globalBestScore,
      totalGamesPlayed: gameAnalytics.totalGamesPlayed,
      totalHamstersWhacked: gameAnalytics.totalHamstersWhacked,
      totalPlayers: gameAnalytics.totalPlayers,
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

          // 2. 获取当前全局统计
          const currentAnalytics = await gameDataManager.getGameAnalytics()
          if (!currentAnalytics) {
            console.error('[Game] Failed to load game analytics')
            return NextResponse.json(
              { error: 'Failed to load game analytics' },
              { status: 500 }
            )
          }

          // 3. 获取用户统计
          const userStats = await gameDataManager.getUserStats(userId)

          // 4. 更新全局统计
          const analyticsUpdates: any = {
            totalGamesPlayed: currentAnalytics.totalGamesPlayed + 1,
            totalHamstersWhacked: currentAnalytics.totalHamstersWhacked + (hamstersWhacked || 0)
          }

          // 检查是否刷新全球最佳分数
          if (score > currentAnalytics.globalBestScore) {
            analyticsUpdates.globalBestScore = score
            console.log(`[Game] 🎉 New global best score: ${score}`)
          }

          // 更新全局统计
          await gameDataManager.updateGameAnalytics(analyticsUpdates)

          // 5. 更新用户统计
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

          await gameDataManager.updateUserStats(userId, userUpdates)

          // 6. 获取更新后的统计
          const updatedAnalytics = await gameDataManager.getGameAnalytics()
          const updatedUserStats = await gameDataManager.getUserStats(userId)

          console.log('[Game] ✅ Game data saved successfully')

          return NextResponse.json({
            success: true,
            globalBestScore: updatedAnalytics?.globalBestScore || 0,
            totalGamesPlayed: updatedAnalytics?.totalGamesPlayed || 0,
            totalHamstersWhacked: updatedAnalytics?.totalHamstersWhacked || 0,
            totalPlayers: updatedAnalytics?.totalPlayers || 0,
            personalBestScore: updatedUserStats?.personalBestScore || 0,
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

