import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sora Invite Codes - Get Free Access to OpenAI\'s Video AI',
  description: '分享和获取 Sora 邀请码，帮助社区成员获得 OpenAI 视频 AI 的访问权限',
  keywords: ['Sora', '邀请码', 'OpenAI', '视频AI', 'invite code'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}


