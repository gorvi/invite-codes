import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ - Sora 2 Invite Codes | Frequently Asked Questions',
  description: 'Find answers to common questions about Sora 2 invite codes, how to use them, and troubleshooting tips.',
  keywords: ['sora 2 faq', 'invite code help', 'sora 2 troubleshooting', 'ai video generation questions'],
}

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Sora 2?",
      answer: "Sora 2 is OpenAI's latest AI video generation model that can create high-quality videos from text descriptions. It's currently in limited access and requires an invite code to use."
    },
    {
      question: "How do I get a Sora 2 invite code?",
      answer: "You can get invite codes from our community platform where users share their codes. Browse the available codes on our homepage and copy one that hasn't been used by many people."
    },
    {
      question: "Are these invite codes free?",
      answer: "Yes! All invite codes shared on our platform are completely free. We're a community-driven platform where users help each other access Sora 2."
    },
    {
      question: "Why do some codes stop working?",
      answer: "Invite codes have limited uses. Once enough people have used a code (usually 4+ successful uses), it gets marked as 'used' and is no longer available. This is normal behavior from OpenAI."
    },
    {
      question: "How do I know if a code is still working?",
      answer: "Check the success rate and vote counts. Codes with higher success rates and recent positive votes are more likely to still be working. We also automatically hide codes that are marked as used or invalid."
    },
    {
      question: "Can I share my own invite codes?",
      answer: "Absolutely! If you receive a Sora 2 invite code, you can share it with the community using our 'Submit Your Sora 2 Code' button. This helps others access the platform."
    },
    {
      question: "What should I do if a code doesn't work?",
      answer: "Click the 'Didn't Work' button to help other users avoid that code. This feedback helps maintain the quality of our community-shared codes."
    },
    {
      question: "How often are new codes added?",
      answer: "New codes are added whenever community members share them. We recommend checking back regularly, especially during peak hours when more people are active."
    },
    {
      question: "Is this platform affiliated with OpenAI?",
      answer: "No, we're an independent community platform. We're not officially affiliated with OpenAI, but we help users access their Sora 2 technology through legitimate invite codes."
    },
    {
      question: "How can I increase my chances of getting access?",
      answer: "Be quick! Popular codes get used up fast. Also, try codes with lower usage counts first, as they're more likely to still be available."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">
            Everything you need to know about Sora 2 invite codes
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Best Practices</h3>
            </div>
            <ul className="space-y-2 text-green-800">
              <li>• Check codes regularly for new additions</li>
              <li>• Vote on codes to help the community</li>
              <li>• Share your codes when you get them</li>
              <li>• Use codes quickly before they expire</li>
            </ul>
          </div>

          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Important Notes</h3>
            </div>
            <ul className="space-y-2 text-orange-800">
              <li>• Codes are limited and can expire</li>
              <li>• Don't share the same code multiple times</li>
              <li>• This is a community platform, not official OpenAI</li>
              <li>• Always use codes from trusted sources</li>
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Still have questions?</h3>
          <p className="text-blue-800 mb-4">
            Join our community discussions or check our help resources
          </p>
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Back to Sora 2 Codes</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
