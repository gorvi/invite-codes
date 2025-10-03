'use client'

import { useState, useEffect } from 'react'
import { X, Gift, CheckCircle, AlertCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}

interface NotificationToastProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export default function NotificationToast({ notifications, onRemove }: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

function NotificationItem({ notification, onRemove }: { notification: Notification, onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto remove
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onRemove(notification.id), 300) // Wait for animation to complete
    }, notification.duration || 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [notification.id, notification.duration, onRemove])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
        return <Gift className="h-5 w-5 text-blue-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Gift className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={`
        max-w-sm w-full transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBgColor()} border rounded-lg shadow-lg p-4
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            {notification.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onRemove(notification.id), 300)
            }}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const showNewCodeNotification = (code: string) => {
    addNotification({
      type: 'info',
      title: '🎉 New invite code added!',
      message: `Invite code "${code}" has been successfully submitted`,
      duration: 6000
    })
  }

  const showSuccessNotification = (message: string) => {
    addNotification({
      type: 'success',
      title: '✅ Operation successful',
      message,
      duration: 4000
    })
  }

  const showErrorNotification = (message: string) => {
    addNotification({
      type: 'error',
      title: '❌ Operation failed',
      message,
      duration: 5000
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    showNewCodeNotification,
    showSuccessNotification,
    showErrorNotification
  }
}

