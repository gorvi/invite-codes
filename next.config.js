/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 图片优化配置
  images: {
    unoptimized: process.env.NODE_ENV === 'production' && (process.env.GITHUB_ACTIONS === '1' || process.env.EDGEONE === '1')
  },

  // 条件性配置：仅在 GitHub Actions 构建时应用 GitHub Pages 相关设置
  ...(process.env.GITHUB_ACTIONS === '1' && {
    output: 'export',
    trailingSlash: true,
    basePath: '/sora2-invite-code',
    assetPrefix: '/sora2-invite-code/',
    
    // 静态导出时的配置
    distDir: 'dist',
    
    // 确保所有页面都能正确导出
    experimental: {
      outputFileTracingRoot: undefined,
    },
  }),

  // EdgeOne 部署配置
  ...(process.env.EDGEONE === '1' && {
    output: 'standalone',
    distDir: '.next',
  }),

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向配置（仅在非 GitHub Pages 环境下生效）
  ...(process.env.GITHUB_ACTIONS !== '1' && {
    async redirects() {
      return [
        {
          source: '/admin',
          destination: '/admin',
          permanent: false,
        },
      ]
    },
  }),

  // Webpack 配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 添加自定义 webpack 配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },
}

module.exports = nextConfig