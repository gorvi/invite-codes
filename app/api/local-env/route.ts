import { NextResponse } from 'next/server'

export async function GET() {
  // 获取所有可用的环境变量（本地开发）
  const allEnvVars = process.env
  
  // 筛选出相关的环境变量
  const relevantEnvVars = Object.keys(allEnvVars)
    .filter(key => 
      key.includes('VERCEL') || 
      key.includes('NODE') || 
      key.includes('KV') || 
      key.includes('REDIS') ||
      key.includes('NEXT')
    )
    .reduce((obj, key) => {
      obj[key] = allEnvVars[key]
      return obj
    }, {} as Record<string, string | undefined>)

  // 获取所有环境变量（用于调试）
  const allVars = Object.keys(allEnvVars).reduce((obj, key) => {
    obj[key] = allEnvVars[key]
    return obj
  }, {} as Record<string, string | undefined>)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      detected: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      keyPrefix: getKeyPrefix(process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'),
      isVercel: process.env.VERCEL === '1',
      isLocal: !process.env.VERCEL,
    },
    relevantEnvVars,
    allEnvVars: allVars, // 注意：在生产环境中这会暴露敏感信息
    storage: {
      type: process.env.KV_REST_API_URL ? 'vercel-kv' : 'local-file',
      kvConfigured: !!process.env.KV_REST_API_URL,
    }
  })
}

function getKeyPrefix(env: string): string {
  switch (env) {
    case 'production':
      return 'prod:'
    case 'preview':
      return 'dev:'
    case 'development':
      return 'local:'
    default:
      return 'local:'
  }
}
