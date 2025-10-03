/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['formbiz.biz'],
    // 禁用图片优化以支持静态导出（仅 GitHub Pages）
    unoptimized: process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS,
  },
  // GitHub Pages 部署配置（仅在有 GITHUB_ACTIONS 时启用）
  ...(process.env.GITHUB_ACTIONS && {
    output: 'export',
    trailingSlash: true,
    basePath: '/sora2-invite-code',
  }),
}

module.exports = nextConfig

