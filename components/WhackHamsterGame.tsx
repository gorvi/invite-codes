'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Rocket, Heart, Trophy, Play, Square } from 'lucide-react'

interface GameState {
  score: number
  bestScore: number
  globalBest: number
  level: number
  lives: number
  gameActive: boolean
  hamsters: boolean[]
  gameTime: number
}

interface HitAnimation {
  index: number
  timestamp: number
}

interface DizzyHamster {
  index: number
  timestamp: number
}

interface ScorePopup {
  index: number
  score: number
  timestamp: number
}

interface MissPopup {
  index: number
  timestamp: number
}

export default function WhackHamsterGame() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    bestScore: 0,
    globalBest: 0, // 从服务器获取真实数据
    level: 1,
    lives: 3,
    gameActive: false,
    hamsters: new Array(9).fill(false),
    gameTime: 0
  })

  const [showInstructions, setShowInstructions] = useState(true)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hamsterTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map()) // 改为Map，key是地鼠索引
  const hitHamstersRef = useRef<Set<number>>(new Set()) // 🔥 改为Ref，实现同步读写
  const hamsterIdRef = useRef<Map<number, number>>(new Map()) // 🔥 新增：每只地鼠的唯一ID
  const nextHamsterIdRef = useRef(0) // 🔥 新增：地鼠ID计数器
  const [hamstersWhacked, setHamstersWhacked] = useState(0) // 追踪本局击中的地鼠数
  const [hitAnimations, setHitAnimations] = useState<HitAnimation[]>([]) // 追踪锤击动画
  const [dizzyHamsters, setDizzyHamsters] = useState<DizzyHamster[]>([]) // 追踪眩晕的地鼠
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]) // 追踪加分特效
  const [missPopups, setMissPopups] = useState<MissPopup[]>([]) // 追踪未击中提示

  // 获取全球最佳分数
  const fetchGlobalBest = async () => {
    try {
      const response = await fetch('/api/game-stats')
      if (response.ok) {
        const data = await response.json()
        setGameState(prev => ({
          ...prev,
          globalBest: data.globalBestScore || 0
        }))
      }
    } catch (error) {
      console.error('Failed to fetch global best score:', error)
    }
  }

  // 提交分数到服务器
  const submitScore = async (score: number, hamstersWhacked: number) => {
    try {
      await fetch('/api/game-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit_score',
          score: score,
          hamstersWhacked: hamstersWhacked
        }),
      })
      
      // 重新获取全球最佳分数
      await fetchGlobalBest()
    } catch (error) {
      console.error('Failed to submit score:', error)
    }
  }

  // 组件加载时获取全球最佳分数
  useEffect(() => {
    fetchGlobalBest()
  }, [])

  const startGame = () => {
    setShowInstructions(false)
    // 清理所有现有的定时器
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
    hamsterTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    hamsterTimeoutsRef.current.clear()
    hamsterIdRef.current.clear()  // 🔥 清空地鼠ID映射
    nextHamsterIdRef.current = 0  // 🔥 重置ID计数器
    
    setGameState(prev => ({
      ...prev,
      gameActive: true,
      score: 0,
      lives: 3,
      level: 1,
      gameTime: 0,
      hamsters: new Array(9).fill(false)
    }))
    
    // 重置本局击中的地鼠数
    setHamstersWhacked(0)
    
    // 清除所有特效状态
    setHitAnimations([])
    setDizzyHamsters([])
    setScorePopups([])
    setMissPopups([])
    hitHamstersRef.current.clear() // 🔥 清空Ref
  }

  const endGame = () => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current)
      gameIntervalRef.current = null
    }
    hamsterTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    hamsterTimeoutsRef.current.clear()
    hamsterIdRef.current.clear()  // 🔥 清空地鼠ID映射
    
    setGameState(prev => ({
      ...prev,
      gameActive: false
    }))
  }

  const whackHamster = useCallback((index: number) => {
    if (!gameState.gameActive) {
      return
    }
    
    // 🔥 防止重复点击：检查是否已经在击中列表中（使用Ref，同步检查）
    if (hitHamstersRef.current.has(index)) {
      console.log(`[WHACK DUPLICATE] Hamster ${index} already being processed, ignoring duplicate click`)
      return
    }
    
    // 🔥 关键修复：检查Map中是否有这只地鼠，而不是state
    // 因为state可能还没更新，但timeout已经创建并存入Map了
    const hamsterTimeout = hamsterTimeoutsRef.current.get(index)
    if (!hamsterTimeout) {
      // Map中没有这只地鼠的timeout = 地鼠不存在或已消失
      console.log(`[WHACK FAILED] Hamster ${index} does not exist or already gone`)
      return
    }
    
    console.log(`[WHACK SUCCESS] Hit hamster ${index}`)
    
    // 🔥 Step 1: Immediately mark as hit (using Ref, synchronous update)
    // This way even if user clicks again, it will be blocked by the check above
    hitHamstersRef.current.add(index)
    console.log(`[HIT SET] Hamster ${index} marked as hit, current hit list:`, Array.from(hitHamstersRef.current))
    
    // 🔥 Step 2: Immediately cancel timeout and delete from Map
    const hamsterId = hamsterIdRef.current.get(index)
    clearTimeout(hamsterTimeout)
    hamsterTimeoutsRef.current.delete(index)
    hamsterIdRef.current.delete(index)  // 🔥 同时删除ID
    console.log(`[CANCEL TIMEOUT] Cancelled hamster ${index} ID ${hamsterId}, remaining in Map:`, Array.from(hamsterTimeoutsRef.current.keys()))
    
    // 计算得分（优化：随等级增加但不要太夸张）
    const points = 10 + (gameState.level - 1) * 2  // 1关10分，2关12分，9关26分
    
    // 添加锤击动画
    const hitAnimation: HitAnimation = {
      index,
      timestamp: Date.now()
    }
    setHitAnimations(prev => [...prev, hitAnimation])
    
    // 添加眩晕地鼠
    const dizzyHamster: DizzyHamster = {
      index,
      timestamp: Date.now()
    }
    setDizzyHamsters(prev => [...prev, dizzyHamster])
    
    // 添加加分特效
    const scorePopup: ScorePopup = {
      index,
      score: points,
      timestamp: Date.now()
    }
    setScorePopups(prev => [...prev, scorePopup])
    
    // 350ms后移除锤击动画（匹配CSS动画时长）
    setTimeout(() => {
      setHitAnimations(prev => prev.filter(anim => anim.timestamp !== hitAnimation.timestamp))
    }, 350)
    
    // 600ms后移除眩晕效果
    setTimeout(() => {
      setDizzyHamsters(prev => prev.filter(dizzy => dizzy.timestamp !== dizzyHamster.timestamp))
      // 🔥 同时清除击中标记，允许同位置的新地鼠被点击（使用Ref，同步清除）
      hitHamstersRef.current.delete(index)
      console.log(`[HIT CLEAR] Hamster ${index} removed from hit list, remaining:`, Array.from(hitHamstersRef.current))
    }, 600)
    
    // 800ms后移除加分特效
    setTimeout(() => {
      setScorePopups(prev => prev.filter(popup => popup.timestamp !== scorePopup.timestamp))
    }, 800)
    
    setGameState(prev => {
      // 🔥 关键修复：立即让地鼠从数组中消失，防止其他timeout误判
      const newHamsters = [...prev.hamsters]
      newHamsters[index] = false
      
      const newScore = prev.score + points
      const newBestScore = Math.max(newScore, prev.bestScore)
      
      return {
        ...prev,
        hamsters: newHamsters,  // 立即更新地鼠状态
        score: newScore,
        bestScore: newBestScore
      }
    })
    
    // 增加击中的地鼠数
    setHamstersWhacked(prev => prev + 1)
  }, [gameState.gameActive, gameState.hamsters, gameState.level])

  // 游戏主循环
  useEffect(() => {
    if (!gameState.gameActive) return

    gameIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        // 检查游戏是否应该结束
        if (prev.lives <= 0) {
          // 游戏结束，提交分数
          submitScore(prev.score, hamstersWhacked)
          return {
            ...prev,
            gameActive: false
          }
        }

        const newHamsters = [...prev.hamsters]
        
        // 随机出现地鼠，提高出现概率确保游戏可玩
        const hamsterChance = 0.4 + (prev.level * 0.05) // 增加基础概率
        if (Math.random() < hamsterChance) {
          const randomIndex = Math.floor(Math.random() * 9)
          if (!newHamsters[randomIndex]) {
            newHamsters[randomIndex] = true
            
            // 🔥 为这只地鼠分配唯一ID
            const hamsterId = nextHamsterIdRef.current++
            hamsterIdRef.current.set(randomIndex, hamsterId)
            console.log(`[CREATE] Hamster ${randomIndex} created with ID ${hamsterId}`)
            
            // 地鼠存在时间随等级减少，但要留足够时间反应（考虑400ms消失动画）
            // 1关: 2000ms, 5关: 1600ms, 10关: 1200ms (实际可点击时间还要减400ms)
            const hamsterDuration = Math.max(1200, 2000 - (prev.level * 80))
            const timeoutId = setTimeout(() => {
              console.log(`[TIMEOUT] Hamster ${randomIndex} ID ${hamsterId} timeout triggered`)
              
              // 🔥 Critical: Check if this is still the same hamster by ID
              const currentHamsterId = hamsterIdRef.current.get(randomIndex)
              if (currentHamsterId !== hamsterId) {
                console.log(`[CANCELLED] Hamster ${randomIndex} ID mismatch (current: ${currentHamsterId}, expected: ${hamsterId}), ignoring timeout`)
                return
              }
              
              // 🔥 Second check: If timeout has been cancelled
              if (!hamsterTimeoutsRef.current.has(randomIndex)) {
                console.log(`[CANCELLED] Hamster ${randomIndex} timeout has been cancelled, ignoring`)
                return
              }
              
              console.log(`[TIMEOUT VALID] Hamster ${randomIndex} ID ${hamsterId} timeout is valid, preparing to process`)
              
              // 从Map中移除这个timeout和ID
              hamsterTimeoutsRef.current.delete(randomIndex)
              hamsterIdRef.current.delete(randomIndex)
              
              // 检查地鼠是否还在并扣血
              setGameState(current => {
                // 第一道防线：如果地鼠已经不在了（可能被击中后消失）
                if (!current.hamsters[randomIndex]) {
                  console.log(`[SKIP] Hamster ${randomIndex} already gone, skipping`)
                  return current
                }
                
                // 🔥 第二道防线：检查这只地鼠是否在击中列表中（使用Ref，同步检查）
                // 注意：不在这里删除标记，因为会在whackHamster的600ms后自动删除
                if (hitHamstersRef.current.has(randomIndex)) {
                  console.log(`[SKIP HIT CONFIRMED] Hamster ${randomIndex} already hit, skipping MISS`)
                  return current
                }
                
                // 地鼠还在且未被击中，显示MISS并扣血
                console.log(`[MISS] Hamster ${randomIndex} missed, deducting life`)
                
                // 添加未击中提示
                const missPopup: MissPopup = {
                  index: randomIndex,
                  timestamp: Date.now()
                }
                setMissPopups(prev => [...prev, missPopup])
                
                // 800ms后移除提示
                setTimeout(() => {
                  setMissPopups(prev => prev.filter(popup => popup.timestamp !== missPopup.timestamp))
                }, 800)
                
                // 扣除生命值并让地鼠消失
                return {
                  ...current,
                  lives: Math.max(0, current.lives - 1),
                  hamsters: current.hamsters.map((hamster, i) => 
                    i === randomIndex ? false : hamster
                  )
                }
              })
            }, hamsterDuration)
            
            // 🔥 将timeout存入Map，key是地鼠索引
            hamsterTimeoutsRef.current.set(randomIndex, timeoutId)
            console.log(`[CREATE] Hamster ${randomIndex} created, will disappear after ${hamsterDuration}ms`)
          }
        }
        
        // 检查是否升级（优化：升级速度更平缓）
        // 1→2关: 100分, 2→3关: 250分, 3→4关: 450分... (每关需要多50分)
        let newLevel = 1
        let requiredScore = 0
        for (let lvl = 1; lvl <= 20; lvl++) {
          requiredScore += 100 + (lvl - 1) * 50
          if (prev.score >= requiredScore) {
            newLevel = lvl + 1
          } else {
            break
          }
        }
        
        return {
          ...prev,
          hamsters: newHamsters,
          level: newLevel,
          gameTime: prev.gameTime + 1
        }
      })
    }, 800)

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
        gameIntervalRef.current = null
      }
    }
  }, [gameState.gameActive])

  // 清理定时器
  useEffect(() => {
    return () => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current)
    }
    hamsterTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    hamsterTimeoutsRef.current.clear()
    }
  }, [])

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${gameState.gameActive ? 'game-hammer-cursor' : ''}`}>
      <style jsx global>{`
        /* 正常状态 - 锤子举起准备（向后倾斜15度，位置稍微向上） */
        .game-hammer-cursor {
          cursor: url('/hammer.svg') 28 12, pointer !important;
        }
        .game-hammer-cursor * {
          cursor: url('/hammer.svg') 28 12, pointer !important;
        }
        
        /* 点击时 - 锤子下击（向前倾斜-25度，位置向下移动） */
        .game-hammer-cursor button.hit-effect {
          cursor: url('/hammer-hit.svg') 36 40, pointer !important;
          animation: buttonImpact 0.35s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        
        .game-hammer-cursor button.hit-effect * {
          cursor: url('/hammer-hit.svg') 36 40, pointer !important;
        }
        
        /* 冲击效果 - 模拟物理碰撞 */
        @keyframes buttonImpact {
          0% {
            transform: scale(1) translateY(0);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          20% {
            transform: scale(0.92) translateY(3px);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
          }
          40% {
            transform: scale(1.03) translateY(-2px);
            box-shadow: 0 8px 12px rgba(255, 215, 0, 0.3);
          }
          60% {
            transform: scale(0.98) translateY(1px);
            box-shadow: 0 3px 5px rgba(0, 0, 0, 0.12);
          }
          80% {
            transform: scale(1.01) translateY(-0.5px);
            box-shadow: 0 5px 8px rgba(0, 0, 0, 0.1);
          }
          100% {
            transform: scale(1) translateY(0);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        }
        
        /* 眩晕地鼠动画 - 轻微左右摇晃 */
        .dizzy-hamster {
          display: inline-block;
          animation: hamsterDizzy 1s ease-in-out;
          transform-origin: center bottom;
        }
        
        @keyframes hamsterDizzy {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-8deg);
          }
          75% {
            transform: rotate(8deg);
          }
        }
        
        /* 眩晕螺旋图案 - 平面旋转 */
        .dizzy-spiral {
          display: inline-block;
          animation: spiralSpin 2s linear infinite;
        }
        
        .dizzy-svg {
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        
        @keyframes spiralSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        /* 左侧星星 - 上下浮动 */
        .dizzy-star-left {
          display: inline-block;
          animation: starFloat 1.5s ease-in-out infinite;
        }
        
        /* 右侧星星 - 上下浮动（反向） */
        .dizzy-star-right {
          display: inline-block;
          animation: starFloat 1.5s ease-in-out infinite;
          animation-delay: 0.75s;
        }
        
        @keyframes starFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        /* 加分特效动画 */
        .score-popup {
          animation: scoreFloat 0.8s ease-out;
        }
        
        @keyframes scoreFloat {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          20% {
            transform: translateY(-10px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-25px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-40px) scale(0.8);
            opacity: 0;
          }
        }
        
        /* 文字描边效果 - 金色加分 */
        .stroke-text {
          text-shadow: 
            -2px -2px 0 #000,
            2px -2px 0 #000,
            -2px 2px 0 #000,
            2px 2px 0 #000,
            0 0 10px #FFD700,
            0 0 20px #FFA500;
        }
        
        /* 未击中提示动画 */
        .miss-popup {
          animation: missShake 0.8s ease-out;
        }
        
        @keyframes missShake {
          0% {
            transform: translateY(0) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          15% {
            transform: translateY(-5px) scale(1.3) rotate(-10deg);
            opacity: 1;
          }
          30% {
            transform: translateY(-8px) scale(1.1) rotate(10deg);
            opacity: 1;
          }
          45% {
            transform: translateY(-10px) scale(1.2) rotate(-5deg);
            opacity: 1;
          }
          60% {
            transform: translateY(-15px) scale(1) rotate(5deg);
            opacity: 0.8;
          }
          80% {
            transform: translateY(-25px) scale(0.9) rotate(0deg);
            opacity: 0.5;
          }
          100% {
            transform: translateY(-35px) scale(0.7) rotate(0deg);
            opacity: 0;
          }
        }
        
        /* 文字描边效果 - 红色MISS */
        .stroke-text-miss {
          text-shadow: 
            -2px -2px 0 #000,
            2px -2px 0 #000,
            -2px 2px 0 #000,
            2px 2px 0 #000,
            0 0 8px #FF0000,
            0 0 15px #FF4444;
        }
      `}</style>
      
      <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
        <span className="text-2xl sm:text-3xl">🐹</span>
        <h3 className="text-lg sm:text-2xl font-bold text-gray-800">Whack-a-Hamster</h3>
        <span className="text-2xl sm:text-3xl">🐹</span>
      </div>
      
      {/* 游戏说明 - 响应式 */}
      {showInstructions && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">🎮 游戏说明</h4>
          <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
            <li>• 点击出现的地鼠 🐹 来获得分数</li>
            <li>• 每击中一只地鼠获得 10 × 等级 的分数</li>
            <li>• 地鼠出现时间会随等级缩短</li>
            <li>• 错过地鼠会扣除一条生命 ❤️</li>
            <li>• 生命用完游戏结束</li>
          </ul>
        </div>
      )}
      
      {/* 游戏统计 - 响应式布局 */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
        <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Score</p>
          <p className="text-lg sm:text-xl font-bold text-blue-600">{gameState.score}</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Your Best</p>
          <p className="text-lg sm:text-xl font-bold text-green-600">{gameState.bestScore}</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Global Best</p>
          <p className="text-lg sm:text-xl font-bold text-purple-600">
            {gameState.globalBest > 0 ? gameState.globalBest : '--'}
          </p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Level</p>
          <p className="text-lg sm:text-xl font-bold text-orange-600">{gameState.level}</p>
        </div>
      </div>
      
      {/* 生命值显示 */}
      <div className="flex items-center justify-center mb-6">
        <p className="text-sm text-gray-600 mr-3">Lives:</p>
        <div className="flex space-x-1">
          {Array.from({ length: gameState.lives }, (_, i) => (
            <Heart key={i} className="h-6 w-6 text-red-500 fill-current" />
          ))}
        </div>
      </div>
      
      {/* 游戏区域 - 响应式尺寸 */}
      <div className="relative grid grid-cols-3 gap-2 sm:gap-3 mb-6 max-w-xs sm:max-w-sm mx-auto">
        {gameState.hamsters.map((showHamster, index) => {
          const isHitting = hitAnimations.some(anim => anim.index === index)
          const isDizzy = dizzyHamsters.some(dizzy => dizzy.index === index)
          const scorePopup = scorePopups.find(popup => popup.index === index)
          const missPopup = missPopups.find(popup => popup.index === index)
          return (
            <button
              key={index}
              onClick={() => whackHamster(index)}
              disabled={!gameState.gameActive || isDizzy}
              className={`aspect-square rounded-xl border-3 transition-all duration-200 transform hover:scale-105 relative overflow-visible ${
                showHamster 
                  ? 'bg-gradient-to-br from-orange-300 to-orange-400 border-orange-500 shadow-lg animate-pulse' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
              } ${!gameState.gameActive ? 'opacity-50 cursor-not-allowed hover:scale-100' : 'cursor-pointer hover:shadow-md'} ${
                isHitting ? 'hit-effect' : ''
              }`}
            >
              {showHamster ? (
                <div className="flex items-center justify-center h-full relative">
                  {isDizzy ? (
                    // 眩晕状态的地鼠
                    <div className="relative">
                      <span className="text-3xl sm:text-4xl dizzy-hamster">🐹</span>
                      {/* 眩晕效果 - 旋转螺旋图案 + 星星 */}
                      <div className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2">
                        <div className="dizzy-spiral relative">
                          <svg width="48" height="48" viewBox="0 0 64 64" className="dizzy-svg sm:w-16 sm:h-16">
                            <circle cx="32" cy="32" r="26" fill="none" stroke="#9B59B6" strokeWidth="3.5" strokeDasharray="40 40" opacity="0.9"/>
                            <circle cx="32" cy="32" r="18" fill="none" stroke="#3498DB" strokeWidth="3" strokeDasharray="28 28" opacity="0.85"/>
                            <circle cx="32" cy="32" r="10" fill="none" stroke="#F39C12" strokeWidth="2.5" strokeDasharray="16 16" opacity="0.8"/>
                          </svg>
                          {/* 左边星星 */}
                          <span className="absolute top-0 -left-1 sm:-left-2 text-xl sm:text-2xl dizzy-star-left">⭐</span>
                          {/* 右边星星 */}
                          <span className="absolute top-0 -right-1 sm:-right-2 text-xl sm:text-2xl dizzy-star-right">⭐</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 正常状态的地鼠
                    <span className="text-3xl sm:text-4xl animate-bounce">🐹</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-xl sm:text-2xl opacity-60">🕳️</span>
                </div>
              )}
              
              {/* 加分特效 */}
              {scorePopup && (
                <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-20">
                  <div className="score-popup">
                    <span className="text-xl sm:text-2xl font-bold text-yellow-400 stroke-text">
                      +{scorePopup.score}
                    </span>
                  </div>
                </div>
              )}
              
              {/* 未击中提示 */}
              {missPopup && (
                <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-20">
                  <div className="miss-popup">
                    <span className="text-lg sm:text-xl font-bold text-red-500 stroke-text-miss">
                      MISS!
                    </span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
        
      </div>
      
      {/* 游戏结束提示 */}
      {!gameState.gameActive && gameState.lives <= 0 && (
        <div className="text-center mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-6 w-6 text-red-500 mr-2" />
            <p className="text-lg font-bold text-red-600">Game Over!</p>
          </div>
          <p className="text-sm text-gray-600">Final Score: <span className="font-semibold">{gameState.score}</span></p>
          <p className="text-sm text-gray-600">Your Best: <span className="font-semibold">{gameState.bestScore}</span></p>
          <p className="text-sm text-gray-600">Global Best: <span className="font-semibold">{gameState.globalBest > 0 ? gameState.globalBest : '--'}</span></p>
          {gameState.score === gameState.globalBest && gameState.score > 0 && (
            <div className="mt-2 p-2 bg-yellow-100 rounded-lg border border-yellow-300">
              <p className="text-sm font-bold text-yellow-800">🏆 新全球记录！</p>
            </div>
          )}
        </div>
      )}


      {/* 游戏控制按钮 - 响应式 */}
      <div className="text-center">
        {!gameState.gameActive ? (
          <div className="relative">
            {/* 锤子引导动画 - 指向开始按钮 */}
            <div className="absolute -top-16 sm:-top-20 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <div className="flex flex-col items-center space-y-1 sm:space-y-2 animate-bounce">
                <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="transform rotate-[70deg] sm:w-16 sm:h-16">
                  <g transform="rotate(-90 32 32)">
                    <rect x="35" y="27" width="7" height="33" fill="#8B4513" rx="3"/>
                    <rect x="36" y="27" width="3" height="33" fill="#A0522D" opacity="0.5" rx="2"/>
                    <rect x="19" y="11" width="29" height="21" fill="#FFD700" stroke="#FFA500" strokeWidth="2.5" rx="4"/>
                    <rect x="21" y="13" width="24" height="7" fill="#FFF8DC" opacity="0.6" rx="3"/>
                    <rect x="19" y="27" width="29" height="4" fill="#DAA520" opacity="0.7" rx="3"/>
                    <rect x="19" y="11" width="29" height="3" fill="#FFEC8B" rx="2"/>
                    <ellipse cx="38.5" cy="58" rx="4" ry="3" fill="#654321"/>
                    <line x1="35" y1="33" x2="42" y2="33" stroke="#654321" strokeWidth="0.8" opacity="0.3"/>
                    <line x1="35" y1="40" x2="42" y2="40" stroke="#654321" strokeWidth="0.8" opacity="0.3"/>
                    <line x1="35" y1="47" x2="42" y2="47" stroke="#654321" strokeWidth="0.8" opacity="0.3"/>
                    <line x1="35" y1="53" x2="42" y2="53" stroke="#654321" strokeWidth="0.8" opacity="0.3"/>
                  </g>
                </svg>
                <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  点击开始
                </span>
              </div>
            </div>
            
            <button
              onClick={startGame}
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 relative z-10 text-sm sm:text-base"
            >
              <Play className="h-5 w-5" />
              <span className="font-semibold">
                {gameState.lives <= 0 ? "🔄 Play Again" : "🚀 Start Game"}
              </span>
            </button>
          </div>
        ) : (
          <button
            onClick={endGame}
            className="inline-flex items-center space-x-2 bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Square className="h-5 w-5" />
            <span className="font-semibold">⏹️ End Game</span>
          </button>
        )}
      </div>
    </div>
  )
}