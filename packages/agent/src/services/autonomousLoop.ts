/**
 * Autonomous Loop - Market Scanner
 * Continuously scans the market for opportunities and triggers signals
 */

import * as cron from 'node-cron';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { emitSignal, SignalType } from './subscriptionService.js';
import { triggerWebhooks } from './webhookService.js';

interface MarketState {
    suiPrice: number;
    gasPrice: number;
    lastUpdate: Date;
    deepBookLiquidity: number;
    scallopApy: { supply: number; borrow: number };
    cetusPoolDepth: number;
}

interface OpportunityConfig {
    minProfitPercentage: number;
    maxGasPrice: number;
    minLiquidity: number;
    minConfidence: number;
}

// Agent state
let isRunning = false;
let scanInterval: NodeJS.Timeout | null = null;
let cronJob: cron.ScheduledTask | null = null;
let marketState: MarketState = {
    suiPrice: 2.50,
    gasPrice: 1000,
    lastUpdate: new Date(),
    deepBookLiquidity: 1000000,
    scallopApy: { supply: 5.2, borrow: 8.5 },
    cetusPoolDepth: 500000
};

const defaultConfig: OpportunityConfig = {
    minProfitPercentage: 0.1,
    maxGasPrice: 5000,
    minLiquidity: 10000,
    minConfidence: 60
};

let config: OpportunityConfig = { ...defaultConfig };

// Sui client
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

/**
 * Initialize the autonomous loop
 */
export function startAutonomousLoop(customConfig?: Partial<OpportunityConfig>): boolean {
    if (isRunning) {
        console.log('⚠️ Autonomous loop already running');
        return false;
    }

    if (customConfig) {
        config = { ...defaultConfig, ...customConfig };
    }

    isRunning = true;

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🤖 AUTONOMOUS AGENT LOOP STARTED                  ║
║         Scanning for opportunities...                      ║
╠═══════════════════════════════════════════════════════════╣
║  Min Profit: ${config.minProfitPercentage}%                                        ║
║  Max Gas: ${config.maxGasPrice} MIST                                  ║
║  Min Confidence: ${config.minConfidence}%                                    ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Start periodic scanning (every 10 seconds)
    scanInterval = setInterval(() => {
        scanMarket();
    }, 10000);

    // Also run cron job for deeper analysis (every minute)
    cronJob = cron.schedule('* * * * *', () => {
        performDeepAnalysis();
    });

    // Initial scan
    scanMarket();

    // Trigger startup webhook
    triggerWebhooks('strategy.activated', {
        agent: 'autonomous-loop',
        config,
        startedAt: new Date().toISOString()
    });

    return true;
}

/**
 * Stop the autonomous loop
 */
export function stopAutonomousLoop(): boolean {
    if (!isRunning) {
        console.log('⚠️ Autonomous loop not running');
        return false;
    }

    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }

    if (cronJob) {
        cronJob.stop();
        cronJob = null;
    }

    isRunning = false;

    console.log('🛑 Autonomous loop stopped');

    triggerWebhooks('strategy.deactivated', {
        agent: 'autonomous-loop',
        stoppedAt: new Date().toISOString()
    });

    return true;
}

/**
 * Get loop status
 */
export function getLoopStatus(): {
    isRunning: boolean;
    config: OpportunityConfig;
    marketState: MarketState;
    uptime: number;
} {
    return {
        isRunning,
        config,
        marketState,
        uptime: isRunning ? Date.now() - marketState.lastUpdate.getTime() : 0
    };
}

/**
 * Update configuration
 */
export function updateConfig(newConfig: Partial<OpportunityConfig>): void {
    config = { ...config, ...newConfig };
    console.log('⚙️ Configuration updated:', config);
}

/**
 * Main market scanning function
 */
async function scanMarket(): Promise<void> {
    if (!isRunning) return;

    try {
        // 1. Fetch gas price
        const gasPrice = await fetchGasPrice();

        // 2. Update market state
        await updateMarketState(gasPrice);

        // 3. Check for opportunities
        await checkArbitrageOpportunities();
        await checkFlashLoanOpportunities();
        await checkLiquidityChanges();

    } catch (error) {
        console.error('❌ Scan error:', error);

        triggerWebhooks('health.warning', {
            type: 'scan_error',
            error: String(error),
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Fetch current gas price
 */
async function fetchGasPrice(): Promise<number> {
    try {
        const gasPrice = await suiClient.getReferenceGasPrice();
        return Number(gasPrice);
    } catch {
        return 1000; // Default fallback
    }
}

/**
 * Update market state with latest data
 */
async function updateMarketState(gasPrice: number): Promise<void> {
    // Simulate price fluctuations (would use real oracles in production)
    const priceChange = (Math.random() - 0.5) * 0.05;
    marketState.suiPrice = Math.max(1, marketState.suiPrice * (1 + priceChange));

    // Update gas
    marketState.gasPrice = gasPrice;

    // Simulate liquidity changes
    const liquidityChange = (Math.random() - 0.5) * 0.02;
    marketState.deepBookLiquidity = Math.max(100000, marketState.deepBookLiquidity * (1 + liquidityChange));

    // Update APY (would fetch from Scallop in production)
    marketState.scallopApy = {
        supply: 5.0 + Math.random() * 2,
        borrow: 7.5 + Math.random() * 3
    };

    marketState.lastUpdate = new Date();
}

/**
 * Check for arbitrage opportunities
 */
async function checkArbitrageOpportunities(): Promise<void> {
    // Simulate price discrepancy detection
    const priceDiscrepancy = Math.random() * 2; // 0-2% discrepancy

    if (priceDiscrepancy > config.minProfitPercentage) {
        const confidence = Math.min(95, 50 + priceDiscrepancy * 20);

        if (confidence >= config.minConfidence) {
            emitSignal('arbitrage_opportunity', 'SUI/USDC', {
                expectedProfit: priceDiscrepancy * 100, // In basis points
                profitPercentage: priceDiscrepancy,
                confidence,
                timeToLive: 30,
                urgency: priceDiscrepancy > 1 ? 'high' : 'medium',
                details: {
                    buyPrice: marketState.suiPrice,
                    sellPrice: marketState.suiPrice * (1 + priceDiscrepancy / 100),
                    source: 'DeepBook',
                    destination: 'Cetus',
                    estimatedGas: marketState.gasPrice * 50000
                }
            });
        }
    }
}

/**
 * Check for flash loan opportunities
 */
async function checkFlashLoanOpportunities(): Promise<void> {
    // Calculate potential flash loan profit
    const apySpread = marketState.scallopApy.borrow - marketState.scallopApy.supply;

    if (apySpread > 2) {
        const confidence = Math.min(90, 40 + apySpread * 10);

        if (confidence >= config.minConfidence) {
            emitSignal('flash_loan_opportunity', 'SUI', {
                expectedProfit: apySpread * 10,
                profitPercentage: apySpread / 10,
                confidence,
                timeToLive: 60,
                urgency: apySpread > 3 ? 'high' : 'medium',
                details: {
                    supplyApy: marketState.scallopApy.supply,
                    borrowApy: marketState.scallopApy.borrow,
                    spread: apySpread,
                    availableLiquidity: marketState.deepBookLiquidity,
                    protocol: 'Scallop'
                }
            });
        }
    }
}

/**
 * Check for significant liquidity changes
 */
async function checkLiquidityChanges(): Promise<void> {
    // Simulate liquidity monitoring
    const liquidityThreshold = 800000; // Alert if below 800k

    if (marketState.deepBookLiquidity < liquidityThreshold) {
        emitSignal('liquidity_change', 'SUI/USDC', {
            confidence: 80,
            timeToLive: 120,
            urgency: 'high',
            details: {
                currentLiquidity: marketState.deepBookLiquidity,
                threshold: liquidityThreshold,
                change: -((liquidityThreshold - marketState.deepBookLiquidity) / liquidityThreshold * 100),
                recommendation: 'Consider pausing large trades'
            }
        });
    }

    // Gas spike detection
    if (marketState.gasPrice > config.maxGasPrice) {
        emitSignal('gas_spike', 'SUI', {
            confidence: 95,
            timeToLive: 300,
            urgency: 'critical',
            details: {
                currentGas: marketState.gasPrice,
                threshold: config.maxGasPrice,
                recommendation: 'Delay non-urgent transactions'
            }
        });
    }
}

/**
 * Perform deep analysis (runs every minute)
 */
async function performDeepAnalysis(): Promise<void> {
    if (!isRunning) return;

    console.log('🔍 Performing deep market analysis...');

    try {
        // Aggregate analysis over the minute
        const analysisResult = {
            timestamp: new Date().toISOString(),
            marketHealth: calculateMarketHealth(),
            recommendations: generateRecommendations(),
            riskLevel: calculateRiskLevel()
        };

        // Emit market alert if concerning
        if (analysisResult.riskLevel > 0.7) {
            emitSignal('price_deviation', 'MARKET', {
                confidence: analysisResult.riskLevel * 100,
                timeToLive: 300,
                urgency: 'high',
                details: {
                    marketHealth: analysisResult.marketHealth,
                    recommendations: analysisResult.recommendations,
                    riskLevel: analysisResult.riskLevel
                }
            });

            triggerWebhooks('market.alert', analysisResult);
        }

        console.log(`📊 Analysis complete - Health: ${(analysisResult.marketHealth * 100).toFixed(1)}%, Risk: ${(analysisResult.riskLevel * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ Deep analysis error:', error);
    }
}

/**
 * Calculate overall market health (0-1)
 */
function calculateMarketHealth(): number {
    let health = 1.0;

    // Penalize high gas
    if (marketState.gasPrice > 2000) {
        health -= 0.1;
    }

    // Penalize low liquidity
    if (marketState.deepBookLiquidity < 500000) {
        health -= 0.2;
    }

    // Penalize extreme price movements
    if (marketState.suiPrice < 1.5 || marketState.suiPrice > 5) {
        health -= 0.15;
    }

    return Math.max(0, Math.min(1, health));
}

/**
 * Generate trading recommendations
 */
function generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (marketState.gasPrice < 1500) {
        recommendations.push('Gas prices favorable - good time for transactions');
    }

    if (marketState.deepBookLiquidity > 1000000) {
        recommendations.push('High liquidity available for large trades');
    }

    if (marketState.scallopApy.supply > 6) {
        recommendations.push('Consider deploying idle capital to Scallop');
    }

    return recommendations;
}

/**
 * Calculate risk level (0-1)
 */
function calculateRiskLevel(): number {
    let risk = 0;

    // High gas increases risk
    risk += Math.min(0.3, marketState.gasPrice / 10000);

    // Low liquidity increases risk
    if (marketState.deepBookLiquidity < 300000) {
        risk += 0.4;
    }

    // Volatile prices increase risk
    if (marketState.suiPrice < 1 || marketState.suiPrice > 6) {
        risk += 0.3;
    }

    return Math.max(0, Math.min(1, risk));
}

/**
 * Manually trigger a scan
 */
export async function triggerManualScan(): Promise<{
    success: boolean;
    marketState: MarketState;
    signalsEmitted: number;
}> {
    const beforeSignals = Date.now();
    await scanMarket();

    return {
        success: true,
        marketState,
        signalsEmitted: 0 // Would track actual signals in production
    };
}

/**
 * Get market state
 */
export function getMarketState(): MarketState {
    return { ...marketState };
}
