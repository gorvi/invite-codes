import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 直接查询 RCA08E 记录
    const { data, error } = await supabase
      .from('sora2_invite_codes')
      .select('*')
      .eq('code', 'RCA08E')
      .single()

    if (error) {
      console.error('[Debug] Error fetching RCA08E:', error)
      return NextResponse.json(
        { error: 'Failed to fetch RCA08E data', details: error },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'RCA08E not found' },
        { status: 404 }
      )
    }

    // 返回原始数据库数据
    const debugData = {
      timestamp: new Date().toISOString(),
      source: 'Direct Supabase Query',
      rawData: data,
      formatted: {
        id: data.id,
        code: data.code,
        status: data.status,
        copy_count: data.copy_count,
        unique_copied_count: data.unique_copied_count,
        worked_votes: data.worked_votes,
        didnt_work_votes: data.didnt_work_votes,
        unique_worked_count: data.unique_worked_count,
        unique_didnt_work_count: data.unique_didnt_work_count,
        worked_user_ids: data.worked_user_ids,
        didnt_work_user_ids: data.didnt_work_user_ids,
        copied_user_ids: data.copied_user_ids
      }
    }

    const response = NextResponse.json(debugData)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error('[Debug] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
