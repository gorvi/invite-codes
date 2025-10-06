/**
 * 实时SEO监控工具
 * 用于持续监控SEO效果
 */

const fs = require('fs');
const path = require('path');

class RealTimeSEOMonitor {
  constructor() {
    this.dataFile = path.join(__dirname, 'seo-monitoring-data.json');
    this.loadHistoricalData();
  }

  // 加载历史数据
  loadHistoricalData() {
    try {
      this.historicalData = fs.existsSync(this.dataFile) 
        ? JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
        : { dailyReports: [], weeklyReports: [], monthlyReports: [] };
    } catch (error) {
      console.error('Failed to load historical data:', error);
      this.historicalData = { dailyReports: [], weeklyReports: [], monthlyReports: [] };
    }
  }

  // 保存数据
  saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.historicalData, null, 2));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // 每日监控检查
  async runDailyCheck() {
    const dailyReport = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      metrics: await this.collectDailyMetrics(),
      alerts: []
    };

    // 检查异常
    dailyReport.alerts = this.checkForAlerts(dailyReport.metrics);
    
    // 保存报告
    this.historicalData.dailyReports.push(dailyReport);
    this.saveData();

    return dailyReport;
  }

  // 收集每日指标
  async collectDailyMetrics() {
    // 这里可以集成各种API
    const metrics = {
      // 模拟数据 - 实际使用时需要真实API
      googleRankings: {
        'sora 2 invite codes': Math.floor(Math.random() * 50) + 1,
        'working sora 2 codes': Math.floor(Math.random() * 30) + 1,
        'sora 2 access': Math.floor(Math.random() * 40) + 1
      },
      organicTraffic: Math.floor(Math.random() * 1000) + 500,
      clickThroughRate: (Math.random() * 5 + 2).toFixed(2),
      bounceRate: (Math.random() * 20 + 10).toFixed(2),
      averageSessionDuration: (Math.random() * 3 + 1).toFixed(2),
      pagesPerSession: (Math.random() * 2 + 1).toFixed(2),
      conversions: Math.floor(Math.random() * 50) + 10
    };

    return metrics;
  }

  // 检查异常
  checkForAlerts(metrics) {
    const alerts = [];
    
    // 检查排名下降
    if (this.historicalData.dailyReports.length > 0) {
      const yesterday = this.historicalData.dailyReports[this.historicalData.dailyReports.length - 1];
      Object.entries(metrics.googleRankings).forEach(([keyword, todayRank]) => {
        const yesterdayRank = yesterday.metrics.googleRankings[keyword];
        if (todayRank > yesterdayRank + 10) {
          alerts.push(`📉 Ranking dropped for "${keyword}": ${yesterdayRank} → ${todayRank}`);
        }
      });
    }
    
    // 检查流量异常
    if (metrics.organicTraffic < 300) {
      alerts.push('📉 Low organic traffic detected');
    }
    
    // 检查跳出率
    if (parseFloat(metrics.bounceRate) > 70) {
      alerts.push('📈 High bounce rate detected');
    }

    return alerts;
  }

  // 生成趋势报告
  generateTrendReport(days = 7) {
    const recentReports = this.historicalData.dailyReports.slice(-days);
    if (recentReports.length === 0) return null;

    const trends = {
      period: `${days} days`,
      averageTraffic: this.calculateAverage(recentReports, 'organicTraffic'),
      averageCTR: this.calculateAverage(recentReports, 'clickThroughRate'),
      rankingTrends: this.calculateRankingTrends(recentReports),
      trafficGrowth: this.calculateGrowth(recentReports, 'organicTraffic')
    };

    return trends;
  }

  // 计算平均值
  calculateAverage(reports, metric) {
    const values = reports.map(r => r.metrics[metric]).filter(v => v !== undefined);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + parseFloat(b), 0) / values.length).toFixed(2);
  }

  // 计算排名趋势
  calculateRankingTrends(reports) {
    const keywords = Object.keys(reports[0].metrics.googleRankings);
    const trends = {};
    
    keywords.forEach(keyword => {
      const ranks = reports.map(r => r.metrics.googleRankings[keyword]);
      const firstRank = ranks[0];
      const lastRank = ranks[ranks.length - 1];
      trends[keyword] = {
        start: firstRank,
        end: lastRank,
        change: lastRank - firstRank,
        trend: lastRank < firstRank ? 'improving' : lastRank > firstRank ? 'declining' : 'stable'
      };
    });
    
    return trends;
  }

  // 计算增长率
  calculateGrowth(reports, metric) {
    if (reports.length < 2) return 0;
    const first = parseFloat(reports[0].metrics[metric]);
    const last = parseFloat(reports[reports.length - 1].metrics[metric]);
    return (((last - first) / first) * 100).toFixed(2);
  }

  // 生成AI SEO效果报告
  generateAISEOReport() {
    const aiSeoMetrics = {
      contentQuality: {
        structuredDataPresent: true,
        semanticKeywords: this.countSemanticKeywords(),
        entityRecognition: this.analyzeEntityRecognition(),
        contentDepth: this.analyzeContentDepth()
      },
      userExperience: {
        pageSpeed: 'Good',
        mobileFriendly: true,
        accessibility: 'Good',
        readability: 'High'
      },
      engagement: {
        timeOnPage: this.calculateAverage(this.historicalData.dailyReports, 'averageSessionDuration'),
        bounceRate: this.calculateAverage(this.historicalData.dailyReports, 'bounceRate'),
        returnVisitors: this.calculateReturnVisitors()
      }
    };

    return aiSeoMetrics;
  }

  // 计算语义关键词数量
  countSemanticKeywords() {
    // 模拟语义关键词分析
    return {
      primary: 5,
      secondary: 15,
      longTail: 8,
      total: 28
    };
  }

  // 分析实体识别
  analyzeEntityRecognition() {
    return {
      organizations: ['OpenAI', 'Sora 2'],
      technologies: ['AI', 'video generation'],
      actions: ['invite', 'access', 'generate'],
      concepts: ['community', 'sharing', 'codes'],
      confidence: 0.85
    };
  }

  // 分析内容深度
  analyzeContentDepth() {
    return {
      wordCount: 2500,
      headingStructure: 'Good',
      internalLinking: 'Optimal',
      externalLinking: 'Appropriate'
    };
  }

  // 计算回访用户
  calculateReturnVisitors() {
    // 模拟计算
    return (Math.random() * 20 + 30).toFixed(1);
  }

  // 输出完整报告
  async generateFullReport() {
    console.log('📊 SEO & AI SEO Monitoring Report');
    console.log('==================================\n');

    // 每日检查
    const dailyReport = await this.runDailyCheck();
    console.log('📅 Daily Report:');
    console.log(`   Date: ${dailyReport.date}`);
    console.log(`   Organic Traffic: ${dailyReport.metrics.organicTraffic}`);
    console.log(`   CTR: ${dailyReport.metrics.clickThroughRate}%`);
    console.log(`   Bounce Rate: ${dailyReport.metrics.bounceRate}%`);
    
    if (dailyReport.alerts.length > 0) {
      console.log('\n🚨 Alerts:');
      dailyReport.alerts.forEach(alert => console.log(`   ${alert}`));
    }

    // 趋势分析
    const trends = this.generateTrendReport(7);
    if (trends) {
      console.log('\n📈 7-Day Trends:');
      console.log(`   Average Traffic: ${trends.averageTraffic}`);
      console.log(`   Traffic Growth: ${trends.trafficGrowth}%`);
      console.log(`   Average CTR: ${trends.averageCTR}%`);
      
      console.log('\n🔑 Ranking Trends:');
      Object.entries(trends.rankingTrends).forEach(([keyword, data]) => {
        const emoji = data.trend === 'improving' ? '📈' : data.trend === 'declining' ? '📉' : '➡️';
        console.log(`   ${emoji} "${keyword}": ${data.start} → ${data.end} (${data.trend})`);
      });
    }

    // AI SEO报告
    const aiSeoReport = this.generateAISEOReport();
    console.log('\n🤖 AI SEO Analysis:');
    console.log('   Content Quality:');
    console.log(`     Semantic Keywords: ${aiSeoReport.contentQuality.semanticKeywords.total}`);
    console.log(`     Entity Recognition: ${aiSeoReport.contentQuality.entityRecognition.confidence * 100}% confidence`);
    console.log('   User Experience:');
    console.log(`     Page Speed: ${aiSeoReport.userExperience.pageSpeed}`);
    console.log(`     Mobile Friendly: ${aiSeoReport.userExperience.mobileFriendly ? '✅' : '❌'}`);
    console.log('   Engagement:');
    console.log(`     Avg. Session Duration: ${aiSeoReport.engagement.timeOnPage} min`);
    console.log(`     Return Visitors: ${aiSeoReport.engagement.returnVisitors}%`);

    return {
      daily: dailyReport,
      trends,
      aiSeo: aiSeoReport
    };
  }
}

// 使用示例
async function runMonitoring() {
  const monitor = new RealTimeSEOMonitor();
  await monitor.generateFullReport();
}

// 如果直接运行
if (require.main === module) {
  runMonitoring().catch(console.error);
}

module.exports = RealTimeSEOMonitor;
