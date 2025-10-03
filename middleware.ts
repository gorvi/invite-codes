import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 只检查明显的恶意爬虫，不影响正常用户和搜索引擎
const MALICIOUS_BOTS = [
  'scraper', 'scraping', 'python-requests', 'curl', 'wget',
  'scrapy', 'beautifulsoup', 'selenium', 'phantom', 'headless'
]

// 检查是否为恶意爬虫
function isMaliciousBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return MALICIOUS_BOTS.some(bot => ua.includes(bot))
}

// 检查是否为可疑请求（更宽松的检查）
function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // 只阻止明显的恶意爬虫
  if (isMaliciousBot(userAgent)) {
    return true
  }
  
  // 允许搜索引擎和正常浏览器
  return false
}

export function middleware(request: NextRequest) {
  // 只对页面请求进行检查，跳过 API 和静态资源
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/static/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 检查是否为可疑请求
  if (isSuspiciousRequest(request)) {
    // 返回 403 禁止访问
    return new NextResponse('Access Denied', { status: 403 })
  }
  
  // 添加安全头部
  const response = NextResponse.next()
  
  // 防止点击劫持
  response.headers.set('X-Frame-Options', 'DENY')
  
  // 防止 MIME 类型嗅探
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS 保护
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // 引用策略
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // 内容安全策略（允许常见的外部资源）
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https://at.alicdn.com; connect-src 'self' https:;"
  )
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
