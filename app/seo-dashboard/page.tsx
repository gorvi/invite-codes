import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, Eye, Target, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SEO Dashboard - Monitor Your Website Performance',
  description: 'Track your website\'s SEO performance, keyword rankings, and traffic analytics in real-time.',
  robots: 'noindex, nofollow' // 防止搜索引擎索引监控页面
}

export default function SEODashboardPage() {
  // 模拟数据 - 实际使用时需要从API获取
  const seoMetrics = {
    organicTraffic: 1250,
    trafficGrowth: 15.3,
    topKeywords: [
      { keyword: 'sora 2 invite codes', position: 8, traffic: 340 },
      { keyword: 'working sora 2 codes', position: 12, traffic: 280 },
      { keyword: 'sora 2 access', position: 15, traffic: 220 },
      { keyword: 'openai sora 2 invite', position: 18, traffic: 180 },
      { keyword: 'ai video generation codes', position: 22, traffic: 150 }
    ],
    pagePerformance: {
      avgSessionDuration: '2:45',
      bounceRate: 42.3,
      pagesPerSession: 2.1,
      conversionRate: 4.2
    },
    technicalSEO: {
      pageSpeed: 89,
      mobileFriendly: true,
      structuredData: 12,
      indexedPages: 8
    }
  }

  const aiSeoMetrics = {
    aiMentions: {
      chatgpt: 3,
      bard: 2,
      bingChat: 1,
      claude: 1
    },
    contentQuality: {
      semanticKeywords: 28,
      entityRecognition: 85,
      contentDepth: 2500,
      readability: 'High'
    },
    userEngagement: {
      timeOnPage: '3:12',
      returnVisitors: 35.2,
      socialShares: 45,
      comments: 12
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SEO & AI SEO Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your website's performance and optimization results
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Organic Traffic</p>
                <p className="text-2xl font-bold text-gray-900">{seoMetrics.organicTraffic.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{seoMetrics.trafficGrowth}% vs last month</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Session</p>
                <p className="text-2xl font-bold text-gray-900">{seoMetrics.pagePerformance.avgSessionDuration}</p>
                <p className="text-sm text-gray-600">per visitor</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-gray-900">{seoMetrics.pagePerformance.bounceRate}%</p>
                <p className="text-sm text-green-600">Good</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{seoMetrics.pagePerformance.conversionRate}%</p>
                <p className="text-sm text-blue-600">Above average</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Keyword Rankings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-primary-600" />
              Keyword Rankings
            </h3>
            <div className="space-y-3">
              {seoMetrics.topKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{keyword.keyword}</p>
                    <p className="text-sm text-gray-600">{keyword.traffic} monthly traffic</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      keyword.position <= 10 ? 'bg-green-100 text-green-800' :
                      keyword.position <= 20 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      #{keyword.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical SEO */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical SEO</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Page Speed Score</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${
                        seoMetrics.technicalSEO.pageSpeed >= 90 ? 'bg-green-500' :
                        seoMetrics.technicalSEO.pageSpeed >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${seoMetrics.technicalSEO.pageSpeed}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{seoMetrics.technicalSEO.pageSpeed}/100</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Mobile Friendly</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  seoMetrics.technicalSEO.mobileFriendly ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {seoMetrics.technicalSEO.mobileFriendly ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Structured Data</span>
                <span className="font-medium">{seoMetrics.technicalSEO.structuredData} items</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Indexed Pages</span>
                <span className="font-medium">{seoMetrics.technicalSEO.indexedPages}</span>
              </div>
            </div>
          </div>

          {/* AI SEO Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI SEO Performance</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Search Mentions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{aiSeoMetrics.aiMentions.chatgpt}</p>
                    <p className="text-sm text-gray-600">ChatGPT</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{aiSeoMetrics.aiMentions.bard}</p>
                    <p className="text-sm text-gray-600">Bard</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{aiSeoMetrics.aiMentions.bingChat}</p>
                    <p className="text-sm text-gray-600">Bing Chat</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{aiSeoMetrics.aiMentions.claude}</p>
                    <p className="text-sm text-gray-600">Claude</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Quality</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Semantic Keywords</span>
                    <span className="font-medium">{aiSeoMetrics.contentQuality.semanticKeywords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entity Recognition</span>
                    <span className="font-medium">{aiSeoMetrics.contentQuality.entityRecognition}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Readability</span>
                    <span className="font-medium">{aiSeoMetrics.contentQuality.readability}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📈 Improve Rankings:</strong> Focus on "sora 2 invite codes" - currently ranking #8, target top 5.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>🤖 AI SEO:</strong> Content is performing well in AI searches. Continue creating comprehensive guides.
                </p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚡ Speed:</strong> Page speed is good (89/100) but could be improved for better Core Web Vitals.
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>📱 Mobile:</strong> Ensure all new content is mobile-optimized for better mobile rankings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Tools */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Tools & Resources</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Free Tools</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Google Search Console</li>
                <li>• Google Analytics 4</li>
                <li>• Google PageSpeed Insights</li>
                <li>• Google Rich Results Test</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Metrics to Track</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Organic traffic growth</li>
                <li>• Keyword ranking positions</li>
                <li>• Click-through rates (CTR)</li>
                <li>• AI search engine mentions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
