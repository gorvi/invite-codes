import { NextRequest } from 'next/server'
import { sora2DataManager } from '@/lib/sora2DataManager'

// 强制动态渲染，避免静态生成
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 如果是静态导出模式（如 GitHub Pages），返回简单响应
  if (process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS) {
    return new Response('SSE not available in static export mode', { status: 404 });
  }
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 🔥 从 Supabase 获取最新数据
        const supabase = sora2DataManager.getSupabaseClient()
        if (supabase) {
          const { data: inviteCodesData, error } = await supabase
            .from('sora2_invite_codes')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
          
          if (!error && inviteCodesData) {
            // 转换数据格式以匹配前端期望
            const formattedCodes = inviteCodesData.map((row: any) => ({
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
            
            const data = JSON.stringify({
              type: 'initial',
              inviteCodes: formattedCodes
            })
            
            controller.enqueue(
              encoder.encode(`data: ${data}\n\n`)
            )
            
            console.log('[SSE] Initial data sent from Supabase:', formattedCodes.length, 'codes')
          } else {
            console.error('[SSE] Failed to fetch initial data:', error)
            // 发送空数据
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'initial', inviteCodes: [] })}\n\n`)
            )
          }
        } else {
          console.error('[SSE] Supabase client not available')
          // 发送空数据
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'initial', inviteCodes: [] })}\n\n`)
          )
        }
      } catch (error) {
        console.error('[SSE] Error in start function:', error)
        // 发送空数据
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'initial', inviteCodes: [] })}\n\n`)
        )
      }

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