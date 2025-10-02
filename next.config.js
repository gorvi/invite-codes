/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['formbiz.biz'],
    // 禁用图片优化以支持静态导出
    unoptimized: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS,
  },
  // GitHub Pages 部署配置
  output: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? 'export' : undefined,
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? '/sora2-invite-code' : '',
}

module.exports = nextConfig

