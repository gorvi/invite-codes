'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "Do all codes here work?",
    answer: "Not every code will work, but we curate codes that have a higher chance of success. We track which codes have been reported as not working to prevent them from appearing again, helping you save time by avoiding codes that are known to be invalid."
  },
  {
    question: "What should I do to help the community?",
    answer: "To keep this service running, please share back your invite codes! It's perfectly fine to use 1-2 invites for your friends, but please submit at least one code back to the community so others can benefit too. This creates a sustainable cycle where everyone helps everyone."
  },
  {
    question: "What is Sora and how do I use it?",
    answer: "Sora is OpenAI's text-to-video AI model that can create realistic video content from text descriptions. Once you get access with an invite code, you can visit sora.chatgpt.com to start creating videos."
  },
  {
    question: "How do I get my own Sora invite codes?",
    answer: "Sora is currently in limited access. You can request access through OpenAI's official channels, or wait for broader availability. Once you get access, you'll receive invite codes to share with others."
  },
  {
    question: "Why do some codes expire or stop working?",
    answer: "Invite codes have limited uses and may expire after a certain period or number of uses. This is normal behavior set by OpenAI to manage the limited access to Sora."
  },
  {
    question: "Is this service free to use?",
    answer: "Yes, this service is completely free to use. We rely on community sharing to keep it running, and optional donations to support the creator."
  },
  {
    question: "How can I improve my chances of getting a working code?",
    answer: "Check back frequently as new codes are added regularly. Consider contributing your own codes to help the community, and vote on code effectiveness to help others."
  }
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={index} className="border rounded-lg">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">{item.question}</span>
              {openItems.has(index) ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {openItems.has(index) && (
              <div className="px-6 pb-4">
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


