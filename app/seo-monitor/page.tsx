'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, TrendingUp, Search, Bot, Target } from 'lucide-react'

export default function SEOMonitorPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [targetUrl, setTargetUrl] = useState('https://www.invitecodes.net')

  // 模拟SEO监控数据
  const mockSEOData = {
    technicalSEO: {
      title: 'Sora 2 Invite Codes - Free Access to AI Video Generation',
      metaDescription: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI.',
      h1Tags: ['Complete Guide to Sora 2 Invite Codes'],
      h2Tags: ['What is Sora 2 and Why Do You Need Invite Codes?', 'How to Find Working Sora 2 Invite Codes'],
      internalLinks: 15,
      externalLinks: 3,
      images: 8,
      imagesWithAlt: 8,
      structuredData: 4,
      pageSize: '245KB',
      loadTime: '1.2s'
    },
    keywordAnalysis: {
      'sora 2 invite codes': { exactMatches: 8, density: '2.1%', totalWords: 1250 },
      'working sora 2 codes': { exactMatches: 3, density: '0.8%', totalWords: 1250 },
      'sora 2 access': { exactMatches: 5, density: '1.3%', totalWords: 1250 },
      'openai sora 2 invite': { exactMatches: 2, density: '0.5%', totalWords: 1250 },
      'ai video generation codes': { exactMatches: 1, density: '0.3%', totalWords: 1250 }
    },
    aiSearchResults: {
      'sora 2 invite codes': {
        relevantContent: [
          { url: '/', relevance: 85, contentSnippets: ['Get free Sora 2 invite codes and share yours with the community...'] },
          { url: '/ai-seo-guide', relevance: 92, contentSnippets: ['Complete guide to finding and using Sora 2 invite codes...'] }
        ],
        entityRecognition: [
          { type: 'organizations', entity: 'OpenAI' },
          { type: 'technologies', entity: 'AI' }
        ],
        semanticAnalysis: [
          { category: 'access_request', matchedKeywords: ['how to get', 'access'], relevance: 0.75 }
        ]
      }
    }
  }

  const runSEOMonitor = async () => {
    setIsRunning(true)
    setError(null)
    
    try {
      const response = await fetch('/api/seo-monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: targetUrl,
          keywords: [
            'sora 2 invite codes',
            'working sora 2 codes', 
            'sora 2 access',
            'openai sora 2 invite',
            'ai video generation codes'
          ]
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError('Failed to run SEO monitor: ' + (err instanceof Error ? err.message : String(err)))
      // 如果API失败，使用模拟数据作为后备
      setResults(mockSEOData)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (value, threshold) => {
    if (value >= threshold) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getDensityColor = (density) => {
    const num = parseFloat(density)
    if (num >= 2) return 'text-green-600'
    if (num >= 1) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                SEO & AI SEO Monitor
              </h1>
              <p className="text-gray-600">
                Real-time analysis of your website's SEO performance and AI search optimization
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label htmlFor="targetUrl" className="text-sm font-medium text-gray-700 mb-1">
                  Target URL
                </label>
                <div className="flex space-x-2">
                  <input
                    id="targetUrl"
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-80"
                    placeholder="https://example.com"
                  />
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setTargetUrl('https://www.invitecodes.net')}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => setTargetUrl('https://www.invitecodes.net/ai-seo-guide')}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      Guide
                    </button>
                    <button
                      onClick={() => setTargetUrl('https://www.invitecodes.net/faq')}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      FAQ
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={runSEOMonitor}
                disabled={isRunning}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Run SEO Monitor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-8">
            {/* Data Source Status */}
            <div className={`p-4 rounded-lg border ${
              results.dataSource === 'real-time' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center">
                {results.dataSource === 'real-time' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                )}
                <div>
                  <p className={`font-medium ${
                    results.dataSource === 'real-time' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {results.dataSource === 'real-time' 
                      ? '✅ Real-time Data Analysis' 
                      : '⚠️ Using Simulated Data (API unavailable)'}
                  </p>
                  <p className={`text-sm ${
                    results.dataSource === 'real-time' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    Analysis completed at {new Date(results.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical SEO Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary-600" />
                Technical SEO Analysis
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Page Title</span>
                    {getStatusIcon(1, 1)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Meta Description</span>
                    {getStatusIcon(1, 1)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">H1 Tags</span>
                    <span className="text-sm text-gray-600">{results.technicalSEO.h1Tags.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">H2 Tags</span>
                    <span className="text-sm text-gray-600">{results.technicalSEO.h2Tags.length}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Internal Links</span>
                    <span className="text-sm text-gray-600">{results.technicalSEO.internalLinks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Images with Alt</span>
                    <span className="text-sm text-gray-600">{results.technicalSEO.imagesWithAlt}/{results.technicalSEO.images}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Structured Data</span>
                    <span className="text-sm text-gray-600">{results.technicalSEO.structuredData} items</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Page Load Time</span>
                    <span className="text-sm text-gray-600">{results.technicalSEO.loadTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                Keyword Analysis
              </h2>
              
              <div className="space-y-3">
                {Object.entries(results.keywordAnalysis).map(([keyword, data]) => (
                  <div key={keyword} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">"{keyword}"</p>
                      <p className="text-sm text-gray-600">
                        {data.exactMatches} exact matches • {data.totalWords} total words
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getDensityColor(data.density)}`}>
                        {data.density} density
                      </p>
                      {parseFloat(data.density) >= 2 ? (
                        <span className="text-xs text-green-600">✅ Good</span>
                      ) : parseFloat(data.density) >= 1 ? (
                        <span className="text-xs text-yellow-600">⚠️ Fair</span>
                      ) : (
                        <span className="text-xs text-red-600">❌ Low</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Search Results */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-primary-600" />
                AI Search Engine Simulation
              </h2>
              
              {Object.entries(results.aiSearchResults).map(([query, result]) => (
                <div key={query} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Query: "{query}"</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Relevant Pages</h4>
                      <div className="space-y-2">
                        {result.relevantContent.map((page, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium">{page.url}</p>
                            <p className="text-gray-600">Relevance: {page.relevance}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Entities Found</h4>
                      <div className="space-y-1">
                        {result.entityRecognition.map((entity, index) => (
                          <div key={index} className="text-sm">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {entity.entity}
                            </span>
                            <span className="ml-1 text-gray-600 text-xs">({entity.type})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Semantic Categories</h4>
                      <div className="space-y-1">
                        {result.semanticAnalysis.map((category, index) => (
                          <div key={index} className="text-sm">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {category.category}
                            </span>
                            <span className="ml-1 text-gray-600 text-xs">
                              ({(category.relevance * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Score */}
            {results.performance && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Performance Score</h2>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {results.performance.score}/100
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      results.performance.score >= 80 ? 'bg-green-100 text-green-800' :
                      results.performance.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Grade: {results.performance.grade}
                    </div>
                  </div>
                  
                  <div className="flex-1 ml-8">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          results.performance.score >= 80 ? 'bg-green-500' :
                          results.performance.score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${results.performance.score}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {results.performance.improvements} areas for improvement identified
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Strengths</h3>
                    <ul className="space-y-1">
                      {results.performance.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Areas for Improvement</h3>
                    <ul className="space-y-1">
                      {results.performance.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Optimization Recommendations</h2>
              
              <div className="space-y-3">
                {results.recommendations?.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          rec.priority === 'high' ? 'text-red-800' :
                          rec.priority === 'medium' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          <strong>
                            {rec.type === 'keyword_optimization' ? '📈 Keyword Optimization:' :
                             rec.type === 'ai_seo' ? '🤖 AI SEO:' :
                             rec.type === 'technical_seo' ? '⚡ Technical SEO:' :
                             rec.type === 'content_expansion' ? '📝 Content:' :
                             '💡 General:'}
                          </strong> {rec.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Action: {rec.action}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                )) || (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>📈 Keyword Optimization:</strong> Increase density for "working sora 2 codes" (currently 0.8%, target 2%+)
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>🤖 AI SEO:</strong> Content performs well in AI searches. Continue creating comprehensive guides.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use This Monitor</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Browser Version</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Click "Run SEO Monitor" to analyze your site</li>
                <li>• View technical SEO metrics and recommendations</li>
                <li>• Check keyword density and AI search simulation</li>
                <li>• Get actionable optimization suggestions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Command Line Version</h3>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-sm">
                  node scripts/seo-monitor.js
                </code>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Requires Node.js and npm packages: axios, cheerio
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
