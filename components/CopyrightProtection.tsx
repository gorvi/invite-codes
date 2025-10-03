'use client'

import { useEffect } from 'react'

export default function CopyrightProtection() {
  useEffect(() => {
    // 只禁用拖拽图片，保持其他功能正常
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      // 只阻止拖拽图片和 logo
      if (target.tagName === 'IMG' || target.closest('[data-protected]')) {
        e.preventDefault()
      }
    }
    
    // 添加事件监听器
    document.addEventListener('dragstart', handleDragStart)
    
    // 清理函数
    return () => {
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])
  
  return null
}
