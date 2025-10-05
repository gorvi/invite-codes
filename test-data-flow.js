// 测试数据流
const testDataFlow = async () => {
  try {
    console.log('🔍 Testing data flow...')
    
    // 1. 测试 API 响应
    const response = await fetch('http://localhost:3000/api/dashboard')
    const dashboardData = await response.json()
    
    console.log('📊 API Response:', {
      hasActiveInviteCodes: !!dashboardData.activeInviteCodes,
      activeInviteCodesType: typeof dashboardData.activeInviteCodes,
      activeInviteCodesLength: dashboardData.activeInviteCodes?.length,
      activeInviteCodesIsArray: Array.isArray(dashboardData.activeInviteCodes),
      activeInviteCodesSample: dashboardData.activeInviteCodes?.slice(0, 2)
    })
    
    // 2. 模拟 dataManager 处理
    const processedData = {
      inviteCodes: dashboardData.activeInviteCodes || [],
      activeCodeCount: dashboardData.activeCodeCount || 0
    }
    
    console.log('🔄 Processed Data:', {
      inviteCodesLength: processedData.inviteCodes.length,
      activeCodeCount: processedData.activeCodeCount
    })
    
    // 3. 模拟页面过滤
    const filteredCodes = processedData.inviteCodes
      .filter(code => code.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log('🎯 Filtered Codes:', {
      filteredLength: filteredCodes.length,
      sampleCodes: filteredCodes.slice(0, 3).map(c => c.code)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testDataFlow()
