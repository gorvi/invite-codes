import { NextRequest } from 'next/server'
import { inviteCodes, analyticsData, addSSEClient, removeSSEClient } from '@/lib/data'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // 注册SSE客户端
      addSSEClient(controller)
      // 发送初始数据
      const initialCodesWithAnalytics = inviteCodes.filter(code => code.status === 'active').map(code => ({
        ...code,
        copiedCount: analyticsData.inviteCodeStats[code.id]?.copyClicks || 0,
        uniqueCopiedCount: analyticsData.uniqueCopyStats[code.id]?.totalUniqueCopies || 0,
      }))
      const data = JSON.stringify({
        type: 'initial',
        inviteCodes: initialCodesWithAnalytics
      })
      
      controller.enqueue(
        encoder.encode(`data: ${data}\n\n`)
      )

      // 定期发送心跳
      const heartbeatInterval = setInterval(() => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
        )
      }, 10000) // 每10秒发送一次心跳

      // 正式版本：禁用随机邀请码生成
      // 只保留心跳机制用于连接检测

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        removeSSEClient(controller)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

