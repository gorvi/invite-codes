import { NextRequest, NextResponse } from 'next/server'
import { inviteCodes, analyticsData, submissionQueue, processSubmissionQueue, sendSSENotification } from '@/lib/data' // Import from lib/data
import { saveInviteCodes, saveAnalytics } from '@/lib/storage'

export async function GET() {
  try {
    const activeCodes = inviteCodes.filter(code => code.status === 'active')
    const codesWithAnalytics = activeCodes.map(code => ({
      ...code,
      // 🔥 优先使用 inviteCode 对象上的值，如果没有则从 analyticsData 读取
      copiedCount: code.copiedCount !== undefined 
        ? code.copiedCount 
        : (analyticsData.inviteCodeStats[code.id]?.copyClicks || 0),
      uniqueCopiedCount: code.uniqueCopiedCount !== undefined 
        ? code.uniqueCopiedCount 
        : (analyticsData.uniqueCopyStats[code.id]?.totalUniqueCopies || 0),
    }))
    return NextResponse.json(codesWithAnalytics)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invite codes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // 使用队列机制处理并发提交
    return new Promise((resolve, reject) => {
      submissionQueue.push({
        code,
        resolve: (result) => {
          resolve(NextResponse.json(result, { status: 201 }))
        },
        reject: (error) => {
          resolve(NextResponse.json(
            { error: error.error },
            { status: error.status || 500 }
          ))
        }
      })
      
      // 处理队列
      processSubmissionQueue()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invite code' },
      { status: 500 }
    )
  }
}

