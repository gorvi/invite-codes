// 测试 dataManager 的工作状态
const testDataManager = async () => {
  try {
    console.log('🔍 Testing dataManager...')
    
    // 模拟浏览器的 fetch
    const fetch = require('node-fetch')
    
    // 模拟 dataManager 的逻辑
    const response = await fetch('http://localhost:3000/api/dashboard')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const dashboardData = await response.json()
    console.log('📊 Dashboard data received')
    
    // 模拟 dataManager 的数据处理
    const processedData = {
      inviteCodes: dashboardData.activeInviteCodes || [],
      activeCodeCount: dashboardData.activeCodeCount || 0,
      totalCodeCount: dashboardData.totalCodeCount || 0,
      usedCodeCount: dashboardData.usedCodeCount || 0,
      invalidCodeCount: dashboardData.invalidCodeCount || 0,
      successfullyUsedCount: dashboardData.successfullyUsedCount || 0,
      submitCount: dashboardData.submitCount || 0,
      dataConsistency: dashboardData.dataConsistency,
      lastUpdated: Date.now()
    }
    
    console.log('🔄 Processed data:', {
      inviteCodesLength: processedData.inviteCodes.length,
      activeCodeCount: processedData.activeCodeCount,
      totalCodeCount: processedData.totalCodeCount
    })
    
    // 模拟页面过滤
    const filteredCodes = processedData.inviteCodes
      .filter(code => code.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log('🎯 Final filtered codes:', {
      count: filteredCodes.length,
      codes: filteredCodes.map(c => c.code)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testDataManager()
