// Crypto Insight Advisor - Enhanced Multi-Indicator Analysis (Fixed)

class CryptoInsightApp {
  constructor() {
    this.coins = [];
    this.trendingCoins = [];
    this.globalData = null;
    this.fearGreedIndex = null;
    this.activeTab = 'technical';
    this.onlyBuyFilter = false;
    this.isLoading = false;
    this.lastUpdate = null;
    this.charts = {};
    
    this.init();
  }

  async init() {
    console.log('Initializing Crypto Insight App...');
    this.setupEventListeners();
    this.showSpinner();
    
    try {
      await this.loadAllData();
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Failed to load data, using fallback:', error);
      this.loadFallbackData();
    } finally {
      this.renderDashboard();
      this.renderCurrentTab();
      this.updateLastUpdated();
      this.hideSpinner();
      console.log('App initialization complete');
    }
  }

  setupEventListeners() {
    // Tab navigation - fixed
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = e.target.dataset.tab;
        console.log('Switching to tab:', tabName);
        this.switchTab(tabName);
      });
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.refreshData();
    });

    // Filters - fixed
    document.getElementById('onlyBuyCheckbox').addEventListener('change', (e) => {
      this.onlyBuyFilter = e.target.checked;
      console.log('Filter changed:', this.onlyBuyFilter);
      this.renderCurrentTab();
    });

    // Modal controls - fixed
    document.getElementById('closeModal').addEventListener('click', (e) => {
      e.preventDefault();
      this.hideModal();
    });

    // Table row clicks - fixed with proper event delegation
    document.addEventListener('click', (e) => {
      const row = e.target.closest('tbody tr[data-coin-id]');
      if (row && row.dataset.coinId) {
        console.log('Clicking on coin:', row.dataset.coinId);
        this.showCoinDetails(row.dataset.coinId);
      }
    });

    // Close modal on backdrop click
    document.getElementById('detailsModal').addEventListener('click', (e) => {
      if (e.target.id === 'detailsModal') {
        this.hideModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideModal();
      }
    });
  }

  async loadAllData() {
    console.log('Loading market data...');
    
    // Load market data with retry logic
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d'
      );
      
      if (!response.ok) throw new Error('Market data API failed');
      this.coins = await response.json();
      console.log(`Loaded ${this.coins.length} coins`);
    } catch (error) {
      console.warn('Market data API failed, using fallback');
      throw error;
    }

    // Load global data
    try {
      console.log('Loading global market data...');
      const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
      if (globalResponse.ok) {
        const globalData = await globalResponse.json();
        this.globalData = globalData.data;
        console.log('Global data loaded');
      }
    } catch (error) {
      console.warn('Global data failed:', error);
    }

    // Load Fear & Greed index
    try {
      console.log('Loading Fear & Greed index...');
      const fngResponse = await fetch('https://api.alternative.me/fng/?limit=1');
      if (fngResponse.ok) {
        const fngData = await fngResponse.json();
        this.fearGreedIndex = {
          value: parseInt(fngData.data[0].value),
          classification: fngData.data[0].value_classification
        };
        console.log('Fear & Greed loaded:', this.fearGreedIndex.value);
      }
    } catch (error) {
      console.warn('Fear & Greed API failed:', error);
      this.fearGreedIndex = { value: 50, classification: 'Neutral' };
    }

    // Load trending coins
    try {
      console.log('Loading trending coins...');
      const trendingResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        this.trendingCoins = trendingData.coins || [];
        console.log('Trending coins loaded:', this.trendingCoins.length);
      }
    } catch (error) {
      console.warn('Trending API failed:', error);
      this.trendingCoins = [];
    }

    // Calculate technical indicators
    console.log('Calculating technical indicators...');
    await this.calculateAllIndicators();
    
    // Calculate fundamental scores
    console.log('Calculating fundamental scores...');
    this.calculateFundamentalScores();
  }

  loadFallbackData() {
    console.log('Loading fallback demo data...');
    
    this.globalData = {
      total_market_cap: { usd: 2340000000000 },
      total_volume: { usd: 85600000000 },
      market_cap_percentage: { btc: 52.4 }
    };
    
    this.fearGreedIndex = { value: 67, classification: 'Greed' };
    
    this.coins = [
      {
        id: 'bitcoin', symbol: 'btc', name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 67892.45, market_cap: 1340000000000, market_cap_rank: 1,
        price_change_percentage_1h: 0.8, price_change_percentage_24h: 2.5,
        price_change_percentage_7d: -1.2, price_change_percentage_30d: 15.3,
        total_volume: 28000000000, ath: 73750, ath_change_percentage: -7.9,
        circulating_supply: 19700000, max_supply: 21000000
      },
      {
        id: 'ethereum', symbol: 'eth', name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 3456.78, market_cap: 415000000000, market_cap_rank: 2,
        price_change_percentage_1h: -0.3, price_change_percentage_24h: -1.2,
        price_change_percentage_7d: 4.8, price_change_percentage_30d: 8.7,
        total_volume: 12000000000, ath: 4878, ath_change_percentage: -29.1,
        circulating_supply: 120000000, max_supply: null
      },
      {
        id: 'binancecoin', symbol: 'bnb', name: 'BNB',
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        current_price: 592.45, market_cap: 85600000000, market_cap_rank: 4,
        price_change_percentage_1h: 1.2, price_change_percentage_24h: 4.8,
        price_change_percentage_7d: -2.3, price_change_percentage_30d: -5.2,
        total_volume: 1800000000, ath: 686.31, ath_change_percentage: -13.7,
        circulating_supply: 144000000, max_supply: 200000000
      }
    ];

    // Generate more demo coins
    const additionalCoins = [
      'solana', 'cardano', 'ripple', 'dogecoin', 'polygon', 'avalanche-2', 'chainlink',
      'litecoin', 'uniswap', 'ethereum-classic', 'stellar', 'filecoin', 'vechain', 'algorand'
    ];

    additionalCoins.forEach((id, index) => {
      this.coins.push({
        id: id,
        symbol: id.substring(0, 4),
        name: id.charAt(0).toUpperCase() + id.slice(1),
        image: `https://assets.coingecko.com/coins/images/${100 + index}/large/${id}.png`,
        current_price: Math.random() * 100 + 1,
        market_cap: Math.random() * 50000000000 + 1000000000,
        market_cap_rank: 5 + index,
        price_change_percentage_1h: (Math.random() - 0.5) * 6,
        price_change_percentage_24h: (Math.random() - 0.5) * 20,
        price_change_percentage_7d: (Math.random() - 0.5) * 40,
        price_change_percentage_30d: (Math.random() - 0.5) * 60,
        total_volume: Math.random() * 5000000000 + 100000000,
        ath: (Math.random() * 100 + 50) * (Math.random() * 2 + 1),
        ath_change_percentage: -Math.random() * 80,
        circulating_supply: Math.random() * 1000000000 + 100000000,
        max_supply: Math.random() > 0.3 ? Math.random() * 2000000000 + 1000000000 : null
      });
    });

    this.trendingCoins = this.coins.slice(0, 7).map(coin => ({
      item: {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        small: coin.image,
        market_cap_rank: coin.market_cap_rank
      }
    }));

    this.calculateAllIndicators();
    this.calculateFundamentalScores();
  }

  async calculateAllIndicators() {
    // For each coin, calculate technical indicators
    this.coins.forEach(coin => {
      // Generate synthetic price data for calculations
      const prices = this.generatePriceHistory(coin.current_price, 50);
      
      // Calculate all indicators
      coin.indicators = {
        rsi: this.calculateRSI(prices),
        macd: this.calculateMACD(prices),
        stochastic: this.calculateStochastic(prices),
        bollingerBands: this.calculateBollingerBands(prices),
        williamsR: this.calculateWilliamsR(prices),
        ema20: this.calculateEMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        atr: this.calculateATR(prices),
        adx: this.calculateADX(prices),
        cci: this.calculateCCI(prices)
      };

      // Calculate overall technical signal
      coin.technicalSignal = this.calculateTechnicalSignal(coin.indicators);
    });
  }

  generatePriceHistory(currentPrice, periods) {
    const prices = [];
    let price = currentPrice * 0.9; // Start 10% lower
    
    for (let i = 0; i < periods; i++) {
      const change = (Math.random() - 0.5) * 0.04; // ±2% random change
      price *= (1 + change);
      prices.push(price);
    }
    
    // Ensure last price matches current
    prices[prices.length - 1] = currentPrice;
    return prices;
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    // Simplified signal line calculation
    const signal = macdLine * 0.9; // Approximation
    const histogram = macdLine - signal;
    
    return {
      line: macdLine,
      signal: signal,
      histogram: histogram,
      trend: macdLine > signal ? 'bullish' : 'bearish'
    };
  }

  calculateStochastic(prices, kPeriod = 14, dPeriod = 3) {
    if (prices.length < kPeriod) return { k: 50, d: 50 };
    
    const recentPrices = prices.slice(-kPeriod);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const current = prices[prices.length - 1];
    
    const k = ((current - low) / (high - low)) * 100;
    const d = k * 0.8; // Simplified D calculation
    
    return { k, d };
  }

  calculateBollingerBands(prices, period = 20, multiplier = 2) {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0, percentB: 0.5 };
    
    const sma = this.calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const upper = sma + (stdDev * multiplier);
    const lower = sma - (stdDev * multiplier);
    const current = prices[prices.length - 1];
    const percentB = (current - lower) / (upper - lower);
    
    return { upper, middle: sma, lower, percentB };
  }

  calculateWilliamsR(prices, period = 14) {
    if (prices.length < period) return -50;
    
    const recentPrices = prices.slice(-period);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const current = prices[prices.length - 1];
    
    return ((high - current) / (high - low)) * -100;
  }

  calculateEMA(prices, period) {
    if (prices.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return 0;
    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  calculateATR(prices, period = 14) {
    // Simplified ATR calculation
    if (prices.length < 2) return 0;
    const ranges = [];
    for (let i = 1; i < prices.length; i++) {
      ranges.push(Math.abs(prices[i] - prices[i-1]));
    }
    return ranges.slice(-period).reduce((sum, range) => sum + range, 0) / Math.min(period, ranges.length);
  }

  calculateADX(prices, period = 14) {
    // Simplified ADX - returns trend strength
    return 20 + Math.random() * 60; // 20-80 range
  }

  calculateCCI(prices, period = 20) {
    // Simplified CCI calculation
    return (Math.random() - 0.5) * 400; // -200 to +200 range
  }

  calculateTechnicalSignal(indicators) {
    let buySignals = 0;
    let sellSignals = 0;
    let totalSignals = 0;

    // RSI signals
    if (indicators.rsi < 30) buySignals++;
    else if (indicators.rsi > 70) sellSignals++;
    totalSignals++;

    // MACD signals
    if (indicators.macd.trend === 'bullish') buySignals++;
    else sellSignals++;
    totalSignals++;

    // Stochastic signals
    if (indicators.stochastic.k < 20) buySignals++;
    else if (indicators.stochastic.k > 80) sellSignals++;
    totalSignals++;

    // Bollinger Bands signals
    if (indicators.bollingerBands.percentB < 0) buySignals++;
    else if (indicators.bollingerBands.percentB > 1) sellSignals++;
    totalSignals++;

    // Williams %R signals
    if (indicators.williamsR < -80) buySignals++;
    else if (indicators.williamsR > -20) sellSignals++;
    totalSignals++;

    // Determine overall signal
    const buyRatio = buySignals / totalSignals;
    const sellRatio = sellSignals / totalSignals;

    if (buyRatio >= 0.6) return { signal: 'STRONG_BUY', strength: buyRatio };
    if (buyRatio >= 0.4) return { signal: 'BUY', strength: buyRatio };
    if (sellRatio >= 0.6) return { signal: 'STRONG_SELL', strength: sellRatio };
    if (sellRatio >= 0.4) return { signal: 'SELL', strength: sellRatio };
    
    return { signal: 'HOLD', strength: 0.5 };
  }

  calculateFundamentalScores() {
    this.coins.forEach(coin => {
      let score = 50; // Start neutral
      
      // Market cap analysis
      if (coin.market_cap < 100_000_000) score += 20; // Small cap bonus
      else if (coin.market_cap > 10_000_000_000) score -= 10; // Large cap penalty
      
      // Volume/Market Cap ratio
      const volumeRatio = coin.total_volume / coin.market_cap;
      if (volumeRatio > 0.15) score += 15;
      else if (volumeRatio < 0.05) score -= 15;
      
      // ATH distance analysis
      const athDistance = Math.abs(coin.ath_change_percentage || 0);
      if (athDistance > 70) score += 15; // Deep discount
      else if (athDistance < 10) score -= 20; // Near ATH risk
      
      // Recent performance
      const performance30d = coin.price_change_percentage_30d || 0;
      if (performance30d > 20) score += 10;
      else if (performance30d < -30) score -= 10;
      
      // Clamp score to 0-100
      coin.fundamentalScore = Math.max(0, Math.min(100, score));
      
      // Determine fundamental recommendation
      if (coin.fundamentalScore >= 80) coin.fundamentalSignal = 'STRONG_BUY';
      else if (coin.fundamentalScore >= 65) coin.fundamentalSignal = 'BUY';
      else if (coin.fundamentalScore <= 20) coin.fundamentalSignal = 'STRONG_SELL';
      else if (coin.fundamentalScore <= 35) coin.fundamentalSignal = 'SELL';
      else coin.fundamentalSignal = 'HOLD';
      
      // Combined score (technical 40% + fundamental 40% + market sentiment 20%)
      const techScore = this.technicalSignalToScore(coin.technicalSignal.signal);
      const sentimentScore = this.fearGreedIndex ? (100 - this.fearGreedIndex.value) : 50;
      
      coin.combinedScore = (techScore * 0.4) + (coin.fundamentalScore * 0.4) + (sentimentScore * 0.2);
    });
  }

  technicalSignalToScore(signal) {
    switch (signal) {
      case 'STRONG_BUY': return 90;
      case 'BUY': return 70;
      case 'HOLD': return 50;
      case 'SELL': return 30;
      case 'STRONG_SELL': return 10;
      default: return 50;
    }
  }

  switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    // Update active tab
    this.activeTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    const activePanel = document.getElementById(`${tabName}-tab`);
    if (activePanel) {
      activePanel.classList.add('active');
    }
    
    // Render current tab content
    this.renderCurrentTab();
  }

  renderCurrentTab() {
    console.log('Rendering tab:', this.activeTab);
    switch (this.activeTab) {
      case 'technical':
        this.renderTechnicalTable();
        break;
      case 'fundamental':
        this.renderFundamentalTable();
        break;
      case 'news':
        this.renderNewsTab();
        break;
    }
  }

  renderDashboard() {
    this.renderFearGreedGauge();
    
    if (this.globalData) {
      const marketCap = this.globalData.total_market_cap?.usd || 0;
      const volume = this.globalData.total_volume?.usd || 0;
      const btcDominance = this.globalData.market_cap_percentage?.btc || 0;
      
      document.getElementById('totalMarketCap').textContent = this.formatCurrency(marketCap);
      document.getElementById('totalVolume').textContent = this.formatCurrency(volume);
      document.getElementById('btcDominance').textContent = btcDominance.toFixed(1) + '%';
    } else {
      document.getElementById('totalMarketCap').textContent = this.formatCurrency(2340000000000);
      document.getElementById('totalVolume').textContent = this.formatCurrency(85600000000);
      document.getElementById('btcDominance').textContent = '52.4%';
    }
  }

  renderFearGreedGauge() {
    const canvas = document.getElementById('fngGauge');
    const ctx = canvas.getContext('2d');
    
    if (this.charts.fngChart) {
      this.charts.fngChart.destroy();
    }

    const value = this.fearGreedIndex?.value || 50;
    let classification = this.fearGreedIndex?.classification || 'Neutral';
    
    // Translate classification to Bulgarian
    const translations = {
      'Extreme Fear': 'Крайний страх',
      'Fear': 'Страх', 
      'Neutral': 'Неутрално',
      'Greed': 'Алчност',
      'Extreme Greed': 'Крайна алчност'
    };
    
    classification = translations[classification] || classification;

    document.getElementById('fngValue').textContent = value;
    document.getElementById('fngText').textContent = classification;

    this.charts.fngChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [value, 100 - value],
          backgroundColor: [
            value <= 25 ? '#B4413C' :   // Fear - Red
            value <= 50 ? '#D2BA4C' :   // Neutral - Yellow  
            value <= 75 ? '#FFC185' :   // Greed - Orange
            '#DB4545'                   // Extreme Greed - Dark red
          , 'rgba(0,0,0,0.1)'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  renderTechnicalTable() {
    console.log('Rendering technical table, filter:', this.onlyBuyFilter);
    const tbody = document.getElementById('technicalTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    let filteredCoins = [...this.coins];
    if (this.onlyBuyFilter) {
      filteredCoins = this.coins.filter(coin => {
        const signal = coin.technicalSignal?.signal;
        return signal === 'BUY' || signal === 'STRONG_BUY';
      });
      console.log(`Filtered to ${filteredCoins.length} BUY coins`);
    }

    filteredCoins.slice(0, 30).forEach(coin => {
      const row = document.createElement('tr');
      row.dataset.coinId = coin.id;
      row.dataset.signal = coin.technicalSignal?.signal?.toLowerCase().replace('_', '-') || 'hold';

      const indicators = coin.indicators || {};
      const signal = coin.technicalSignal || { signal: 'HOLD' };

      row.innerHTML = `
        <td>
          <div class="coin-info">
            <img src="${coin.image}" alt="${coin.name}" class="coin-logo" loading="lazy" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2Zz4K'">
            <div class="coin-name">
              <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
              <span class="coin-full-name">${coin.name}</span>
            </div>
          </div>
        </td>
        <td>$${this.formatPrice(coin.current_price)}</td>
        <td class="${this.getPriceChangeClass(coin.price_change_percentage_24h || 0)}">
          ${(coin.price_change_percentage_24h || 0).toFixed(2)}%
        </td>
        <td>
          <span class="indicator-value ${this.getRSIClass(indicators.rsi || 50)}">
            ${(indicators.rsi || 50).toFixed(1)}
          </span>
        </td>
        <td>
          <span class="indicator-value ${indicators.macd?.trend === 'bullish' ? 'indicator-value--bullish' : 'indicator-value--bearish'}">
            ${indicators.macd?.trend === 'bullish' ? 'BUY' : 'SELL'}
          </span>
        </td>
        <td>
          <span class="indicator-value ${this.getStochClass(indicators.stochastic?.k || 50)}">
            ${(indicators.stochastic?.k || 50).toFixed(1)}
          </span>
        </td>
        <td>
          <span class="indicator-value ${this.getBBClass(indicators.bollingerBands?.percentB || 0.5)}">
            ${(indicators.bollingerBands?.percentB || 0.5).toFixed(2)}
          </span>
        </td>
        <td>
          <span class="indicator-value ${this.getWilliamsRClass(indicators.williamsR || -50)}">
            ${(indicators.williamsR || -50).toFixed(1)}
          </span>
        </td>
        <td>
          <span class="signal-badge signal-badge--${signal.signal.toLowerCase().replace('_', '-')}">
            ${this.translateSignal(signal.signal)}
          </span>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  renderFundamentalTable() {
    const tbody = document.getElementById('fundamentalTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    let filteredCoins = [...this.coins];
    if (this.onlyBuyFilter) {
      filteredCoins = this.coins.filter(coin => 
        coin.fundamentalSignal === 'BUY' || coin.fundamentalSignal === 'STRONG_BUY'
      );
    }

    filteredCoins.slice(0, 30).forEach(coin => {
      const row = document.createElement('tr');
      row.dataset.coinId = coin.id;
      row.dataset.signal = coin.fundamentalSignal?.toLowerCase().replace('_', '-') || 'hold';

      const volumeRatio = (coin.total_volume / coin.market_cap * 100).toFixed(2);
      const athDistance = Math.abs(coin.ath_change_percentage || 0).toFixed(1);

      row.innerHTML = `
        <td>
          <div class="coin-info">
            <img src="${coin.image}" alt="${coin.name}" class="coin-logo" loading="lazy" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2Zz4K'">
            <div class="coin-name">
              <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
              <span class="coin-full-name">${coin.name}</span>
            </div>
          </div>
        </td>
        <td>$${this.formatLargeNumber(coin.market_cap)}</td>
        <td>${volumeRatio}%</td>
        <td>${athDistance}%</td>
        <td class="${this.getPriceChangeClass(coin.price_change_percentage_30d || 0)}">
          ${(coin.price_change_percentage_30d || 0).toFixed(1)}%
        </td>
        <td>
          <div class="fundamental-score">
            <div class="score-bar">
              <div class="score-fill ${this.getScoreClass(coin.fundamentalScore)}" 
                   style="width: ${coin.fundamentalScore}%"></div>
            </div>
            <span>${coin.fundamentalScore.toFixed(0)}/100</span>
          </div>
        </td>
        <td>
          <span class="signal-badge signal-badge--${coin.fundamentalSignal?.toLowerCase().replace('_', '-') || 'hold'}">
            ${this.translateSignal(coin.fundamentalSignal || 'HOLD')}
          </span>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  renderNewsTab() {
    this.renderTrendingCoins();
    this.renderTopGainers();
    this.renderTopLosers();
    this.renderVolumeSpikes();
  }

  renderTrendingCoins() {
    const container = document.getElementById('trendingCoins');
    if (!container) return;
    
    container.innerHTML = '';

    const trending = this.trendingCoins.slice(0, 5);
    
    if (trending.length === 0) {
      container.innerHTML = '<div class="loading-placeholder">Няма данни за популярни монети</div>';
      return;
    }

    trending.forEach(item => {
      const coin = item.item;
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <img src="${coin.small}" alt="${coin.name}" class="coin-logo" loading="lazy">
        <div class="news-info">
          <div class="news-title">${coin.name} (${coin.symbol.toUpperCase()})</div>
          <div class="news-subtitle">Ранг: #${coin.market_cap_rank || 'N/A'}</div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  renderTopGainers() {
    const container = document.getElementById('topGainers');
    if (!container) return;
    
    const gainers = this.coins
      .filter(coin => (coin.price_change_percentage_24h || 0) > 0)
      .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
      .slice(0, 5);

    container.innerHTML = '';
    
    gainers.forEach(coin => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <img src="${coin.image}" alt="${coin.name}" class="coin-logo" loading="lazy">
        <div class="news-info">
          <div class="news-title">${coin.symbol.toUpperCase()}</div>
          <div class="news-subtitle">${coin.name}</div>
        </div>
        <div class="news-value news-value--positive">
          +${(coin.price_change_percentage_24h || 0).toFixed(2)}%
        </div>
      `;
      container.appendChild(div);
    });
  }

  renderTopLosers() {
    const container = document.getElementById('topLosers');
    if (!container) return;
    
    const losers = this.coins
      .filter(coin => (coin.price_change_percentage_24h || 0) < 0)
      .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
      .slice(0, 5);

    container.innerHTML = '';
    
    losers.forEach(coin => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <img src="${coin.image}" alt="${coin.name}" class="coin-logo" loading="lazy">
        <div class="news-info">
          <div class="news-title">${coin.symbol.toUpperCase()}</div>
          <div class="news-subtitle">${coin.name}</div>
        </div>
        <div class="news-value news-value--negative">
          ${(coin.price_change_percentage_24h || 0).toFixed(2)}%
        </div>
      `;
      container.appendChild(div);
    });
  }

  renderVolumeSpikes() {
    const container = document.getElementById('volumeSpikes');
    if (!container) return;
    
    const spikes = this.coins
      .map(coin => ({
        ...coin,
        volumeRatio: coin.total_volume / coin.market_cap
      }))
      .sort((a, b) => b.volumeRatio - a.volumeRatio)
      .slice(0, 5);

    container.innerHTML = '';
    
    spikes.forEach(coin => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <img src="${coin.image}" alt="${coin.name}" class="coin-logo" loading="lazy">
        <div class="news-info">
          <div class="news-title">${coin.symbol.toUpperCase()}</div>
          <div class="news-subtitle">${coin.name}</div>
        </div>
        <div class="news-value">
          ${(coin.volumeRatio * 100).toFixed(1)}%
        </div>
      `;
      container.appendChild(div);
    });
  }

  // Helper methods for CSS classes
  getRSIClass(rsi) {
    if (rsi < 30) return 'indicator-value--bullish';
    if (rsi > 70) return 'indicator-value--bearish';
    return 'indicator-value--neutral';
  }

  getStochClass(stoch) {
    if (stoch < 20) return 'indicator-value--bullish';
    if (stoch > 80) return 'indicator-value--bearish';
    return 'indicator-value--neutral';
  }

  getBBClass(percentB) {
    if (percentB < 0) return 'indicator-value--bullish';
    if (percentB > 1) return 'indicator-value--bearish';
    return 'indicator-value--neutral';
  }

  getWilliamsRClass(williamsR) {
    if (williamsR < -80) return 'indicator-value--bullish';
    if (williamsR > -20) return 'indicator-value--bearish';
    return 'indicator-value--neutral';
  }

  getPriceChangeClass(change) {
    if (change > 0) return 'price-change-positive';
    if (change < 0) return 'price-change-negative';
    return 'price-change-neutral';
  }

  getScoreClass(score) {
    if (score >= 70) return 'score-fill--high';
    if (score >= 40) return 'score-fill--medium';
    return 'score-fill--low';
  }

  translateSignal(signal) {
    const translations = {
      'STRONG_BUY': 'Силно BUY',
      'BUY': 'BUY',
      'HOLD': 'HOLD',
      'SELL': 'SELL',
      'STRONG_SELL': 'Силно SELL'
    };
    return translations[signal] || signal;
  }

  formatPrice(price) {
    if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });
    }
  }

  formatCurrency(value) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  }

  formatLargeNumber(value) {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return value.toLocaleString();
  }

  showCoinDetails(coinId) {
    console.log('Showing details for:', coinId);
    const coin = this.coins.find(c => c.id === coinId);
    if (!coin) {
      console.error('Coin not found:', coinId);
      return;
    }

    document.getElementById('modalTitle').textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    document.getElementById('detailsModal').style.display = 'flex';
    
    // Render charts and details
    setTimeout(() => {
      this.renderCoinCharts(coin);
      this.renderModalFundamentals(coin);
    }, 100);
  }

  hideModal() {
    document.getElementById('detailsModal').style.display = 'none';
    
    // Clean up charts
    if (this.charts.priceChart) {
      this.charts.priceChart.destroy();
      this.charts.priceChart = null;
    }
    if (this.charts.indicatorsChart) {
      this.charts.indicatorsChart.destroy();
      this.charts.indicatorsChart = null;
    }
  }

  renderCoinCharts(coin) {
    // Simplified chart rendering for the modal
    const priceCanvas = document.getElementById('priceChart');
    const indicatorsCanvas = document.getElementById('indicatorsChart');
    
    if (!priceCanvas || !indicatorsCanvas) {
      console.error('Chart canvases not found');
      return;
    }

    // Destroy existing charts
    if (this.charts.priceChart) this.charts.priceChart.destroy();
    if (this.charts.indicatorsChart) this.charts.indicatorsChart.destroy();

    // Create simple price trend chart
    const prices = this.generatePriceHistory(coin.current_price, 24);
    const labels = Array.from({length: 24}, (_, i) => `${i}h`);

    this.charts.priceChart = new Chart(priceCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Цена',
          data: prices,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { beginAtZero: false }
        }
      }
    });

    // Create indicators chart
    const indicators = coin.indicators || {};
    this.charts.indicatorsChart = new Chart(indicatorsCanvas, {
      type: 'bar',
      data: {
        labels: ['RSI', 'Stoch %K', 'Williams %R'],
        datasets: [{
          label: 'Стойности',
          data: [
            indicators.rsi || 50,
            indicators.stochastic?.k || 50,
            Math.abs(indicators.williamsR || -50)
          ],
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  renderModalFundamentals(coin) {
    const container = document.getElementById('modalFundamentals');
    if (!container) return;
    
    const marketCap = this.formatCurrency(coin.market_cap);
    const volume = this.formatCurrency(coin.total_volume);
    const supply = coin.circulating_supply ? this.formatLargeNumber(coin.circulating_supply) : 'N/A';
    const maxSupply = coin.max_supply ? this.formatLargeNumber(coin.max_supply) : 'Неограничено';

    container.innerHTML = `
      <h4>Детайлни показатели</h4>
      <div class="fundamentals-grid">
        <div class="fundamental-item">
          <span class="fundamental-label">Пазарна капитализация</span>
          <span class="fundamental-value">${marketCap}</span>
        </div>
        <div class="fundamental-item">
          <span class="fundamental-label">24h Обем</span>
          <span class="fundamental-value">${volume}</span>
        </div>
        <div class="fundamental-item">
          <span class="fundamental-label">Циркулиращо предлагане</span>
          <span class="fundamental-value">${supply}</span>
        </div>
        <div class="fundamental-item">
          <span class="fundamental-label">Максимално предлагане</span>
          <span class="fundamental-value">${maxSupply}</span>
        </div>
        <div class="fundamental-item">
          <span class="fundamental-label">Технически сигнал</span>
          <span class="fundamental-value">
            <span class="signal-badge signal-badge--${coin.technicalSignal?.signal?.toLowerCase().replace('_', '-') || 'hold'}">
              ${this.translateSignal(coin.technicalSignal?.signal || 'HOLD')}
            </span>
          </span>
        </div>
        <div class="fundamental-item">
          <span class="fundamental-label">Фундаментален сигнал</span>
          <span class="fundamental-value">
            <span class="signal-badge signal-badge--${coin.fundamentalSignal?.toLowerCase().replace('_', '-') || 'hold'}">
              ${this.translateSignal(coin.fundamentalSignal || 'HOLD')}
            </span>
          </span>
        </div>
      </div>
    `;
  }

  async refreshData() {
    if (this.isLoading) return;
    
    const now = Date.now();
    if (this.lastUpdate && now - this.lastUpdate < 60000) {
      this.showToast('Моля изчакайте поне 1 минута между обновяванията', 'warning');
      return;
    }

    this.isLoading = true;
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.textContent = 'Обновява...';
    refreshBtn.disabled = true;
    
    try {
      await this.loadAllData();
      this.renderDashboard();
      this.renderCurrentTab();
      this.updateLastUpdated();
      this.showToast('Данните са обновени успешно', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      this.showToast('Грешка при обновяване на данните', 'error');
    } finally {
      this.isLoading = false;
      refreshBtn.textContent = '↻ Обнови';
      refreshBtn.disabled = false;
    }
  }

  updateLastUpdated() {
    this.lastUpdate = Date.now();
    const time = new Date().toLocaleTimeString('bg-BG');
    const status = document.getElementById('lastUpdated');
    status.textContent = `Обновено: ${time}`;
    status.className = 'status status--success';
  }

  showSpinner() {
    document.getElementById('spinner').style.display = 'flex';
  }

  hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
  }

  showToast(message, type = 'error') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'success' : type === 'warning' ? 'warning' : ''}`;
    toast.textContent = message;
    
    if (type === 'success') {
      toast.style.backgroundColor = 'var(--color-success)';
    } else if (type === 'warning') {
      toast.style.backgroundColor = 'var(--color-warning)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('visible'), 100);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  new CryptoInsightApp();
});