// 简单的测试脚本
const testSimple = async () => {
  try {
    console.log('🔍 Testing simple data flow...')
    
    // 使用 node-fetch
    const fetch = require('node-fetch')
    
    // 1. 直接测试 API
    const response = await fetch('http://localhost:3000/api/dashboard')
    const data = await response.json()
    
    console.log('📊 API Data:', {
      hasActiveInviteCodes: !!data.activeInviteCodes,
      activeInviteCodesLength: data.activeInviteCodes?.length,
      activeInviteCodesType: typeof data.activeInviteCodes,
      firstCode: data.activeInviteCodes?.[0]?.code
    })
    
    // 2. 测试数据处理
    const processedCodes = data.activeInviteCodes || []
    console.log('🔄 Processed:', {
      length: processedCodes.length,
      firstCode: processedCodes[0]?.code,
      allCodes: processedCodes.map(c => c.code)
    })
    
    // 3. 测试过滤
    const activeCodes = processedCodes.filter(code => code.status === 'active')
    console.log('🎯 Active Codes:', {
      length: activeCodes.length,
      codes: activeCodes.map(c => c.code)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testSimple()
