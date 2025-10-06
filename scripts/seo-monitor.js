/**
 * SEO和AI SEO效果监控脚本
 * 用于检验网站优化效果
 */

const axios = require('axios');
const cheerio = require('cheerio');

class SEOMonitor {
  constructor() {
    this.siteUrl = 'https://www.invitecodes.net';
    this.targetKeywords = [
      'sora 2 invite codes',
      'working sora 2 codes',
      'sora 2 access',
      'openai sora 2 invite',
      'ai video generation codes',
      'free sora 2 codes'
    ];
  }

  // 1. 检查页面技术SEO
  async checkTechnicalSEO(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const seoData = {
        title: $('title').text(),
        metaDescription: $('meta[name="description"]').attr('content'),
        h1Tags: $('h1').map((i, el) => $(el).text()).get(),
        h2Tags: $('h2').map((i, el) => $(el).text()).get(),
        internalLinks: $('a[href^="/"]').length,
        externalLinks: $('a[href^="http"]').length,
        images: $('img').length,
        imagesWithAlt: $('img[alt]').length,
        structuredData: this.findStructuredData($),
        pageSize: response.data.length,
        loadTime: response.headers['x-response-time'] || 'N/A'
      };

      return seoData;
    } catch (error) {
      console.error('Technical SEO check failed:', error.message);
      return null;
    }
  }

  // 2. 查找结构化数据
  findStructuredData($) {
    const structuredData = [];
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        structuredData.push(data);
      } catch (e) {
        console.warn('Invalid structured data:', e.message);
      }
    });
    return structuredData;
  }

  // 3. 检查关键词密度
  checkKeywordDensity(content, keyword) {
    const words = content.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    const keywordPhrase = keyword.toLowerCase();
    
    let density = 0;
    let exactMatches = 0;
    
    // 精确匹配
    const regex = new RegExp(keywordPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    exactMatches = (content.match(regex) || []).length;
    
    // 关键词密度
    density = (exactMatches / words.length) * 100;
    
    return {
      exactMatches,
      density: density.toFixed(2),
      totalWords: words.length
    };
  }

  // 4. 模拟AI搜索引擎查询
  async simulateAISearch(query) {
    // 这里可以集成OpenAI API或其他AI搜索引擎
    const aiSearchResults = {
      query: query,
      timestamp: new Date().toISOString(),
      // 模拟AI搜索结果
      relevantContent: await this.findRelevantContent(query),
      entityRecognition: this.extractEntities(query),
      semanticAnalysis: this.analyzeSemanticRelevance(query)
    };
    
    return aiSearchResults;
  }

  // 5. 查找相关内容
  async findRelevantContent(query) {
    const pages = [
      '/',
      '/ai-seo-guide',
      '/faq',
      '/how-it-works',
      '/submit'
    ];
    
    const relevantPages = [];
    
    for (const page of pages) {
      try {
        const response = await axios.get(`${this.siteUrl}${page}`);
        const $ = cheerio.load(response.data);
        const content = $('body').text().toLowerCase();
        
        if (content.includes(query.toLowerCase())) {
          relevantPages.push({
            url: page,
            relevance: this.calculateRelevance(content, query),
            contentSnippets: this.extractSnippets(content, query)
          });
        }
      } catch (error) {
        console.warn(`Failed to check page ${page}:`, error.message);
      }
    }
    
    return relevantPages.sort((a, b) => b.relevance - a.relevance);
  }

  // 6. 计算相关性分数
  calculateRelevance(content, query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    let score = 0;
    
    queryWords.forEach(word => {
      const matches = (content.match(new RegExp(word, 'gi')) || []).length;
      score += matches;
    });
    
    // 考虑内容长度
    const contentLength = content.split(/\s+/).length;
    return (score / contentLength) * 100;
  }

  // 7. 提取实体
  extractEntities(query) {
    const entities = {
      organizations: ['OpenAI', 'Sora 2'],
      technologies: ['AI', 'video generation', 'machine learning'],
      actions: ['invite', 'access', 'generate', 'create'],
      concepts: ['community', 'sharing', 'codes']
    };
    
    const foundEntities = [];
    Object.entries(entities).forEach(([type, list]) => {
      list.forEach(entity => {
        if (query.toLowerCase().includes(entity.toLowerCase())) {
          foundEntities.push({ type, entity });
        }
      });
    });
    
    return foundEntities;
  }

  // 8. 语义相关性分析
  analyzeSemanticRelevance(query) {
    const semanticCategories = {
      'access_request': ['how to get', 'where to find', 'access', 'invite'],
      'problem_solving': ['not working', 'failed', 'error', 'troubleshoot'],
      'comparison': ['best', 'working', 'effective', 'successful'],
      'tutorial': ['guide', 'tutorial', 'how to', 'learn']
    };
    
    const queryLower = query.toLowerCase();
    const matchedCategories = [];
    
    Object.entries(semanticCategories).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => queryLower.includes(keyword));
      if (matches.length > 0) {
        matchedCategories.push({
          category,
          matchedKeywords: matches,
          relevance: matches.length / keywords.length
        });
      }
    });
    
    return matchedCategories;
  }

  // 9. 提取内容片段
  extractSnippets(content, query) {
    const sentences = content.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(query.toLowerCase())
    );
    
    return relevantSentences.slice(0, 3).map(sentence => 
      sentence.trim().substring(0, 150) + '...'
    );
  }

  // 10. 生成SEO报告
  async generateSEOReport() {
    console.log('🔍 Starting SEO and AI SEO analysis...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      technicalSEO: {},
      keywordAnalysis: {},
      aiSearchResults: {},
      recommendations: []
    };

    // 检查主页技术SEO
    console.log('📊 Checking technical SEO...');
    report.technicalSEO = await this.checkTechnicalSEO(this.siteUrl);
    
    // 关键词分析
    console.log('🔑 Analyzing keywords...');
    for (const keyword of this.targetKeywords) {
      if (report.technicalSEO) {
        const content = Object.values(report.technicalSEO).join(' ');
        report.keywordAnalysis[keyword] = this.checkKeywordDensity(content, keyword);
      }
    }
    
    // AI搜索模拟
    console.log('🤖 Simulating AI search queries...');
    for (const query of this.targetKeywords.slice(0, 3)) {
      report.aiSearchResults[query] = await this.simulateAISearch(query);
    }
    
    // 生成建议
    report.recommendations = this.generateRecommendations(report);
    
    return report;
  }

  // 11. 生成优化建议
  generateRecommendations(report) {
    const recommendations = [];
    
    // 技术SEO建议
    if (report.technicalSEO) {
      if (!report.technicalSEO.metaDescription) {
        recommendations.push('❌ Missing meta description');
      }
      if (report.technicalSEO.h1Tags.length === 0) {
        recommendations.push('❌ Missing H1 tag');
      }
      if (report.technicalSEO.imagesWithAlt < report.technicalSEO.images * 0.8) {
        recommendations.push('⚠️ Some images missing alt text');
      }
    }
    
    // 关键词建议
    Object.entries(report.keywordAnalysis).forEach(([keyword, data]) => {
      if (parseFloat(data.density) < 1) {
        recommendations.push(`📝 Consider increasing "${keyword}" keyword density (current: ${data.density}%)`);
      }
      if (data.exactMatches === 0) {
        recommendations.push(`🔍 Add exact match for "${keyword}"`);
      }
    });
    
    // AI SEO建议
    Object.entries(report.aiSearchResults).forEach(([query, result]) => {
      if (result.relevantContent.length === 0) {
        recommendations.push(`🤖 Create content for AI query: "${query}"`);
      }
    });
    
    return recommendations;
  }

  // 12. 输出报告
  async runFullAnalysis() {
    const report = await this.generateSEOReport();
    
    console.log('\n📈 SEO & AI SEO Analysis Report');
    console.log('=====================================\n');
    
    // 技术SEO摘要
    if (report.technicalSEO) {
      console.log('🔧 Technical SEO:');
      console.log(`   Title: ${report.technicalSEO.title}`);
      console.log(`   Meta Description: ${report.technicalSEO.metaDescription ? '✅' : '❌'}`);
      console.log(`   H1 Tags: ${report.technicalSEO.h1Tags.length}`);
      console.log(`   Internal Links: ${report.technicalSEO.internalLinks}`);
      console.log(`   Structured Data: ${report.technicalSEO.structuredData.length} items\n`);
    }
    
    // 关键词分析
    console.log('🔑 Keyword Analysis:');
    Object.entries(report.keywordAnalysis).forEach(([keyword, data]) => {
      console.log(`   "${keyword}": ${data.exactMatches} matches, ${data.density}% density`);
    });
    console.log('');
    
    // AI搜索结果
    console.log('🤖 AI Search Simulation:');
    Object.entries(report.aiSearchResults).forEach(([query, result]) => {
      console.log(`   Query: "${query}"`);
      console.log(`   Relevant Pages: ${result.relevantContent.length}`);
      console.log(`   Entities Found: ${result.entityRecognition.length}`);
      console.log(`   Semantic Categories: ${result.semanticAnalysis.length}\n`);
    });
    
    // 建议
    console.log('💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
    
    return report;
  }
}

// 使用示例
async function main() {
  const monitor = new SEOMonitor();
  await monitor.runFullAnalysis();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SEOMonitor;
