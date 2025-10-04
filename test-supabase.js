/**
 * 测试 Supabase 连接和数据操作
 */

const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log('🔍 测试 Supabase 连接...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? '✅ 已配置' : '❌ 未配置')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n📊 测试数据库连接...')
    
    // 测试读取邀请码表
    const { data: codes, error: codesError } = await supabase
      .from('invite_codes')
      .select('count')
      .limit(1)
    
    if (codesError) {
      console.error('❌ 读取邀请码表失败:', codesError.message)
    } else {
      console.log('✅ 邀请码表连接成功')
    }
    
    // 测试读取统计表
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('id')
      .limit(1)
    
    if (analyticsError) {
      console.error('❌ 读取统计表失败:', analyticsError.message)
    } else {
      console.log('✅ 统计表连接成功')
    }
    
    // 测试插入一条测试数据
    console.log('\n📝 测试数据插入...')
    const testCode = {
      code: 'TEST-' + Date.now(),
      created_at: new Date().toISOString(),
      is_active: true,
      submitter_name: 'Test User',
      copy_count: 0,
      worked_votes: 0,
      didnt_work_votes: 0,
      unique_copied_count: 0,
      unique_worked_count: 0,
      unique_didnt_work_count: 0,
      worked_user_ids: [],
      didnt_work_user_ids: [],
      copied_user_ids: []
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('invite_codes')
      .insert([testCode])
      .select()
    
    if (insertError) {
      console.error('❌ 插入测试数据失败:', insertError.message)
    } else {
      console.log('✅ 插入测试数据成功:', insertData[0].code)
      
      // 删除测试数据
      const { error: deleteError } = await supabase
        .from('invite_codes')
        .delete()
        .eq('code', testCode.code)
      
      if (deleteError) {
        console.error('❌ 删除测试数据失败:', deleteError.message)
      } else {
        console.log('✅ 删除测试数据成功')
      }
    }
    
    console.log('\n🎉 Supabase 连接测试完成！')
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
  }
}

testConnection()
