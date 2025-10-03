import { NextResponse } from 'next/server'

export async function GET() {
  // 获取所有环境变量
  const envVars = {
    // Vercel 自动设置的环境变量
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_REGION: process.env.VERCEL_REGION,
    
    // Node.js 环境变量
    NODE_ENV: process.env.NODE_ENV,
    
    // 数据库相关环境变量（隐藏敏感信息）
    KV_REST_API_URL: process.env.KV_REST_API_URL ? '✅ 已配置' : '❌ 未配置',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '✅ 已配置' : '❌ 未配置',
    
    // 其他可能的环境变量
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
  }

  // 根据环境变量推断当前环境
  const detectedEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
  const keyPrefix = getKeyPrefix(detectedEnv)

  return NextResponse.json({
    environment: {
      detected: detectedEnv,
      keyPrefix: keyPrefix,
      isVercel: process.env.VERCEL === '1',
    },
    environmentVariables: envVars,
    timestamp: new Date().toISOString(),
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
