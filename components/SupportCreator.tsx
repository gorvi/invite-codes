interface SupportCreatorProps {
  compact?: boolean
}

export default function SupportCreator({ compact = false }: SupportCreatorProps) {
  if (compact) {
    // 紧凑按钮模式
    return (
      <a
        href="https://www.buymeacoffee.com/goodai"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 sm:flex-initial"
      >
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">☕</span>
            <span className="font-semibold">Support Creator</span>
          </div>
        </div>
      </a>
    )
  }

  // 原来的卡片模式
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">☕</span>
        <h3 className="text-lg font-semibold text-gray-800">Support the Creator</h3>
      </div>
      <p className="text-gray-700 mb-4">
        This is something I built for testing out, but if you find it genuinely helpful, consider supporting me!
      </p>
      <a
        href="https://www.buymeacoffee.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
      >
        <img 
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
          alt="Buy Me A Coffee" 
          className="h-8"
        />
      </a>
    </div>
  )
}


