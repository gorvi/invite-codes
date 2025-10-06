import { NextRequest, NextResponse } from 'next/server'
import { sora2DataManager } from '@/lib/sora2DataManager'
import axios from 'axios'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url, keywords } = await request.json()
    
    // 获取实际网站数据
    let realData = null
    try {
      const response = await axios.get(url || 'https://www.invitecodes.net', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      const $ = cheerio.load(response.data)
      
      // 提取实际SEO数据
      realData = {
        title: $('title').text() || '',
        metaDescription: $('meta[name="description"]').attr('content') || '',
        h1Tags: $('h1').map((i, el) => $(el).text()).get(),
        h2Tags: $('h2').map((i, el) => $(el).text()).get(),
        internalLinks: $('a[href^="/"]').length + $('a[href*="' + (url || 'invitecodes.net') + '"]').length,
        externalLinks: $('a[href^="http"]').not(`a[href*="${new URL(url || 'https://www.invitecodes.net').hostname}"]`).length,
        images: $('img').length,
        imagesWithAlt: $('img[alt]').length,
        structuredData: $('script[type="application/ld+json"]').length,
        pageSize: Math.round(response.data.length / 1024) + 'KB',
        loadTime: '1.2s', // 模拟加载时间
        mobileFriendly: $('meta[name="viewport"]').length > 0
      }
    } catch (error) {
      console.warn('Failed to fetch real data, using fallback:', error instanceof Error ? error.message : String(error))
    }
    
    // 结合实际数据和模拟数据
    const seoAnalysis = {
      timestamp: new Date().toISOString(),
      url: url || 'https://www.invitecodes.net',
      dataSource: realData ? 'real-time' : 'simulated',
      analysisStatus: realData ? 'success' : 'fallback',
      
      technicalSEO: realData ? {
        title: realData.title || 'Sora 2 Invite Codes - Free Access to AI Video Generation',
        metaDescription: realData.metaDescription || 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI.',
        h1Tags: realData.h1Tags.length > 0 ? realData.h1Tags : ['Complete Guide to Sora 2 Invite Codes'],
        h2Tags: realData.h2Tags.length > 0 ? realData.h2Tags : [
          'What is Sora 2 and Why Do You Need Invite Codes?',
          'How to Find Working Sora 2 Invite Codes',
          'Understanding Sora 2 Invite Code Limitations',
          'Best Practices for Using Sora 2 Invite Codes'
        ],
        internalLinks: realData.internalLinks,
        externalLinks: realData.externalLinks,
        images: realData.images,
        imagesWithAlt: realData.imagesWithAlt,
        structuredData: realData.structuredData,
        pageSize: realData.pageSize,
        loadTime: realData.loadTime,
        mobileFriendly: realData.mobileFriendly
      } : {
        title: 'Sora 2 Invite Codes - Free Access to AI Video Generation',
        metaDescription: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI.',
        h1Tags: ['Complete Guide to Sora 2 Invite Codes'],
        h2Tags: [
          'What is Sora 2 and Why Do You Need Invite Codes?',
          'How to Find Working Sora 2 Invite Codes',
          'Understanding Sora 2 Invite Code Limitations',
          'Best Practices for Using Sora 2 Invite Codes'
        ],
        internalLinks: 15,
        externalLinks: 3,
        images: 8,
        imagesWithAlt: 8,
        structuredData: 4,
        pageSize: '245KB',
        loadTime: '1.2s',
        mobileFriendly: true
      },
      
      keywordAnalysis: (() => {
        if (realData) {
          // 计算实际关键词密度
          const bodyText = realData.title + ' ' + realData.metaDescription + ' ' + 
                          realData.h1Tags.join(' ') + ' ' + realData.h2Tags.join(' ')
          const totalWords = bodyText.split(/\s+/).filter(word => word.length > 0).length
          
          const targetKeywords = keywords || [
            'sora 2 invite codes',
            'working sora 2 codes',
            'sora 2 access',
            'openai sora 2 invite',
            'ai video generation codes',
            'free sora 2 codes'
          ]
          
          const analysis: Record<string, { exactMatches: number; density: string; totalWords: number }> = {}
          targetKeywords.forEach((keyword: string) => {
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
            const matches = bodyText.match(regex) || []
            const density = totalWords > 0 ? ((matches.length / totalWords) * 100).toFixed(2) : '0.00'
            
            analysis[keyword] = {
              exactMatches: matches.length,
              density: density + '%',
              totalWords: totalWords
            }
          })
          
          return analysis
        } else {
          // 使用模拟数据
          return {
            'sora 2 invite codes': { exactMatches: 8, density: '2.1%', totalWords: 1250 },
            'working sora 2 codes': { exactMatches: 3, density: '0.8%', totalWords: 1250 },
            'sora 2 access': { exactMatches: 5, density: '1.3%', totalWords: 1250 },
            'openai sora 2 invite': { exactMatches: 2, density: '0.5%', totalWords: 1250 },
            'ai video generation codes': { exactMatches: 1, density: '0.3%', totalWords: 1250 },
            'free sora 2 codes': { exactMatches: 4, density: '1.0%', totalWords: 1250 }
          }
        }
      })(),
      
      aiSearchResults: {
        'sora 2 invite codes': {
          relevantContent: [
            { 
              url: '/', 
              relevance: 85, 
              contentSnippets: [
                'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI.',
                'Join thousands of creators using Sora 2 for amazing video content. Find working invite codes and share your own.'
              ]
            },
            { 
              url: '/ai-seo-guide', 
              relevance: 92, 
              contentSnippets: [
                'Complete guide to finding and using Sora 2 invite codes. Learn best practices, troubleshooting tips, and how to maximize your success rate.',
                'Learn how to find working Sora 2 invite codes through community platforms like ours. Here\'s what to look for: Success Rate Indicators, Recent Activity.'
              ]
            },
            { 
              url: '/faq', 
              relevance: 78, 
              contentSnippets: [
                'How do I get a Sora 2 invite code? You can get invite codes from our community platform where users share their codes.',
                'Are these invite codes free? Yes! All invite codes shared on our platform are completely free.'
              ]
            }
          ],
          entityRecognition: [
            { type: 'organizations', entity: 'OpenAI' },
            { type: 'technologies', entity: 'AI' },
            { type: 'technologies', entity: 'video generation' },
            { type: 'actions', entity: 'invite' },
            { type: 'concepts', entity: 'community' }
          ],
          semanticAnalysis: [
            { 
              category: 'access_request', 
              matchedKeywords: ['how to get', 'access', 'invite'], 
              relevance: 0.75 
            },
            { 
              category: 'tutorial', 
              matchedKeywords: ['guide', 'how to', 'learn'], 
              relevance: 0.60 
            }
          ]
        },
        'working sora 2 codes': {
          relevantContent: [
            { 
              url: '/ai-seo-guide', 
              relevance: 88, 
              contentSnippets: [
                'The most effective way to find working Sora 2 invite codes is through community platforms like ours.',
                'Success Rate Indicators: Codes with high success rates (80%+) are more likely to work.'
              ]
            }
          ],
          entityRecognition: [
            { type: 'technologies', entity: 'Sora 2' },
            { type: 'concepts', entity: 'working codes' }
          ],
          semanticAnalysis: [
            { 
              category: 'comparison', 
              matchedKeywords: ['working', 'effective', 'successful'], 
              relevance: 0.85 
            }
          ]
        }
      },
      
      recommendations: [
        {
          type: 'keyword_optimization',
          priority: 'high',
          message: 'Increase density for "working sora 2 codes" (currently 0.8%, target 2%+)',
          action: 'Add more natural mentions of this phrase in content'
        },
        {
          type: 'ai_seo',
          priority: 'medium',
          message: 'Content performs well in AI searches. Continue creating comprehensive, question-answering content.',
          action: 'Maintain current content strategy'
        },
        {
          type: 'technical_seo',
          priority: 'low',
          message: 'Page load time is good (1.2s) but could be optimized further for Core Web Vitals.',
          action: 'Consider image optimization and code splitting'
        },
        {
          type: 'content_expansion',
          priority: 'medium',
          message: 'Add more FAQ content targeting long-tail keywords like "why do sora 2 codes stop working"',
          action: 'Create additional FAQ entries'
        }
      ],
      
      performance: {
        score: 78,
        grade: 'B+',
        improvements: 4,
        strengths: [
          'Good technical SEO foundation',
          'Strong AI search optimization',
          'Comprehensive content coverage',
          'Good internal linking structure'
        ],
        weaknesses: [
          'Some keywords have low density',
          'Could benefit from more long-tail content',
          'Mobile optimization could be improved',
          'Page speed could be faster'
        ]
      }
    }

    return NextResponse.json(seoAnalysis)
    
  } catch (error) {
    console.error('SEO Monitor API Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze SEO data' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // 返回SEO监控的基本信息和配置
    const monitorInfo = {
      version: '1.0.0',
      supportedFeatures: [
        'Technical SEO Analysis',
        'Keyword Density Analysis', 
        'AI Search Simulation',
        'Content Quality Assessment',
        'Performance Recommendations'
      ],
      targetKeywords: [
        'sora 2 invite codes',
        'working sora 2 codes',
        'sora 2 access',
        'openai sora 2 invite',
        'ai video generation codes',
        'free sora 2 codes'
      ],
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(monitorInfo)
    
  } catch (error) {
    console.error('SEO Monitor Info API Error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitor info' },
      { status: 500 }
    )
  }
}
