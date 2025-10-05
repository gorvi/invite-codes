// app/api/cleanup/route.ts - 数据清理 API

import { NextRequest } from 'next/server'
import { 
  runFullCleanup, 
  cleanupExpiredCodes, 
  cleanupInactiveUserStats, 
  cleanupOrphanedStats,
  getDataStats 
} from '@/lib/cleanup'

// 管理员密钥（应该从环境变量读取）
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-change-me'

/**
 * 验证管理员权限
 */
function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const apiKey = request.headers.get('x-api-key')
  
  // 支持两种认证方式：
  // 1. Authorization: Bearer <key>
  // 2. X-API-Key: <key>
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    return token === ADMIN_KEY
  }
  
  if (apiKey) {
    return apiKey === ADMIN_KEY
  }
  
  return false
}

/**
 * GET /api/cleanup - 获取数据统计
 */
export async function GET(request: NextRequest) {
  // 不需要管理员权限，任何人都可以查看统计
  const stats = getDataStats()
  
  return Response.json({
    success: true,
    stats,
  })
}

/**
 * POST /api/cleanup - 执行数据清理
 * 
 * Body:
 * {
 *   "action": "full" | "expired" | "users" | "orphaned",
 *   "dryRun": boolean  // 试运行，不实际删除
 * }
 * 
 * Headers:
 * Authorization: Bearer <admin-key>
 * 或
 * X-API-Key: <admin-key>
 */
export async function POST(request: NextRequest) {
  // 验证管理员权限
  if (!verifyAdmin(request)) {
    return Response.json(
      { error: 'Unauthorized. Admin key required.' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    const { action = 'full', dryRun = false } = body
    
    console.log(`[Cleanup API] Action: ${action}, Dry run: ${dryRun}`)
    
    if (dryRun) {
      // 试运行模式：只返回统计，不实际删除
      const stats = getDataStats()
      return Response.json({
        success: true,
        dryRun: true,
        message: 'Dry run completed. No data was deleted.',
        stats,
      })
    }
    
    let result
    
    switch (action) {
      case 'full':
        result = await runFullCleanup()
        break
      
      case 'expired':
        result = await cleanupExpiredCodes()
        break
      
      case 'users':
        result = await cleanupInactiveUserStats()
        break
      
      case 'orphaned':
        result = await cleanupOrphanedStats()
        break
      
      default:
        return Response.json(
          { error: `Invalid action: ${action}. Valid actions: full, expired, users, orphaned` },
          { status: 400 }
        )
    }
    
    return Response.json({
      success: true,
      action,
      result,
      message: 'Cleanup completed successfully',
    })
    
  } catch (error) {
    console.error('[Cleanup API] Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cleanup - 强制删除所有数据（危险操作）
 * 
 * Headers:
 * Authorization: Bearer <admin-key>
 * X-Confirm-Delete: yes
 */
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const confirmHeader = request.headers.get('x-confirm-delete')
  
  if (confirmHeader !== 'yes') {
    return Response.json(
      { 
        error: 'Missing confirmation. Add header: X-Confirm-Delete: yes',
        warning: 'This will delete ALL data permanently!'
      },
      { status: 400 }
    )
  }
  
  // TODO: 实现完全清空数据的逻辑
  // 这里暂时返回错误，防止误操作
  return Response.json(
    { error: 'This endpoint is disabled for safety. Manually delete data/ folder if needed.' },
    { status: 403 }
  )
}

