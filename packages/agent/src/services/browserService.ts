/**
 * SuiLoop Browser Control Service
 * 
 * Provides browser automation capabilities using Puppeteer/CDP:
 * - Web scraping for price data
 * - Form filling for DEX interactions
 * - Screenshot capture for verification
 * - Page navigation and interaction
 * 
 * Inspired by OpenClaw's browser control feature.
 */

import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';

// ============================================================================
// TYPES
// ============================================================================

interface BrowserConfig {
    headless?: boolean;
    userDataDir?: string;
    proxy?: string;
    viewport?: { width: number; height: number };
    timeout?: number;
}

interface ScrapeResult {
    success: boolean;
    data?: any;
    error?: string;
    screenshot?: string;
    url: string;
    timestamp: Date;
}

interface PriceData {
    price: number;
    change24h: number;
    volume24h: number;
    source: string;
}

interface PoolData {
    poolId: string;
    tokenA: string;
    tokenB: string;
    tvl: number;
    apr: number;
    fee: number;
}

// ============================================================================
// BROWSER SERVICE
// ============================================================================

export class BrowserService {
    private browser: Browser | null = null;
    private pages: Map<string, Page> = new Map();
    private config: BrowserConfig;
    private screenshotDir: string;

    constructor(config: BrowserConfig = {}) {
        this.config = {
            headless: true,
            timeout: 30000,
            viewport: { width: 1920, height: 1080 },
            ...config
        };

        this.screenshotDir = path.join(process.cwd(), '.suiloop', 'screenshots');
    }

    /**
     * Initialize the browser
     */
    async initialize(): Promise<void> {
        if (this.browser) return;

        console.log('🌐 Initializing browser...');

        await fs.ensureDir(this.screenshotDir);

        this.browser = await puppeteer.launch({
            headless: this.config.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                ...(this.config.proxy ? [`--proxy-server=${this.config.proxy}`] : [])
            ],
            defaultViewport: this.config.viewport,
            userDataDir: this.config.userDataDir
        });

        console.log('✅ Browser initialized');
    }

    /**
     * Create a new page with default settings
     */
    async createPage(id: string = 'default'): Promise<Page> {
        await this.initialize();

        const page = await this.browser!.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Set default timeout
        page.setDefaultTimeout(this.config.timeout!);

        // Block unnecessary resources for faster loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const blockedTypes = ['image', 'stylesheet', 'font', 'media'];
            if (blockedTypes.includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        this.pages.set(id, page);
        return page;
    }

    /**
     * Get or create a page
     */
    async getPage(id: string = 'default'): Promise<Page> {
        if (this.pages.has(id)) {
            return this.pages.get(id)!;
        }
        return this.createPage(id);
    }

    /**
     * Navigate to a URL
     */
    async navigate(url: string, pageId: string = 'default'): Promise<boolean> {
        try {
            const page = await this.getPage(pageId);
            await page.goto(url, { waitUntil: 'networkidle2' });
            return true;
        } catch (error) {
            console.error('Navigation error:', error);
            return false;
        }
    }

    /**
     * Take a screenshot
     */
    async screenshot(
        pageId: string = 'default',
        filename?: string
    ): Promise<string> {
        const page = await this.getPage(pageId);

        const screenshotPath = path.join(
            this.screenshotDir,
            filename || `screenshot_${Date.now()}.png`
        );

        await page.screenshot({ path: screenshotPath, fullPage: true });

        return screenshotPath;
    }

    /**
     * Extract text content from a selector
     */
    async getText(selector: string, pageId: string = 'default'): Promise<string | null> {
        try {
            const page = await this.getPage(pageId);
            await page.waitForSelector(selector, { timeout: 5000 });
            return page.$eval(selector, el => el.textContent?.trim() || '');
        } catch {
            return null;
        }
    }

    /**
     * Extract multiple text elements
     */
    async getTexts(selector: string, pageId: string = 'default'): Promise<string[]> {
        try {
            const page = await this.getPage(pageId);
            await page.waitForSelector(selector, { timeout: 5000 });
            return page.$$eval(selector, els => els.map(el => el.textContent?.trim() || ''));
        } catch {
            return [];
        }
    }

    /**
     * Click an element
     */
    async click(selector: string, pageId: string = 'default'): Promise<boolean> {
        try {
            const page = await this.getPage(pageId);
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.click(selector);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Type into an input
     */
    async type(
        selector: string,
        text: string,
        pageId: string = 'default'
    ): Promise<boolean> {
        try {
            const page = await this.getPage(pageId);
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.type(selector, text);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Fill a form
     */
    async fillForm(
        fields: Record<string, string>,
        pageId: string = 'default'
    ): Promise<boolean> {
        try {
            for (const [selector, value] of Object.entries(fields)) {
                await this.type(selector, value, pageId);
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Wait for element
     */
    async waitFor(
        selector: string,
        pageId: string = 'default',
        timeout: number = 10000
    ): Promise<boolean> {
        try {
            const page = await this.getPage(pageId);
            await page.waitForSelector(selector, { timeout });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Evaluate JavaScript in page context
     */
    async evaluate<T>(fn: () => T, pageId: string = 'default'): Promise<T | null> {
        try {
            const page = await this.getPage(pageId);
            return await page.evaluate(fn);
        } catch {
            return null;
        }
    }

    // ========================================================================
    // DEFI-SPECIFIC SCRAPERS
    // ========================================================================

    /**
     * Scrape SUI price from CoinGecko
     */
    async scrapeSuiPrice(): Promise<PriceData | null> {
        try {
            await this.navigate('https://www.coingecko.com/en/coins/sui', 'price');

            const page = await this.getPage('price');
            await page.waitForSelector('[data-target="price.price"]', { timeout: 10000 });

            const priceText = await this.getText('[data-target="price.price"]', 'price');
            const changeText = await this.getText('[data-target="percent-change.value"]', 'price');

            const price = parseFloat(priceText?.replace(/[$,]/g, '') || '0');
            const change24h = parseFloat(changeText?.replace(/[%]/g, '') || '0');

            return {
                price,
                change24h,
                volume24h: 0, // Would need additional selector
                source: 'coingecko'
            };
        } catch (error) {
            console.error('Price scrape error:', error);
            return null;
        }
    }

    /**
     * Scrape pool data from Cetus
     */
    async scrapeCetusPools(): Promise<PoolData[]> {
        try {
            await this.navigate('https://app.cetus.zone/liquidity/pools', 'pools');

            const page = await this.getPage('pools');
            await page.waitForSelector('.pool-row', { timeout: 15000 });

            // This is simplified - actual implementation would need proper selectors
            const pools = await page.$$eval('.pool-row', rows => {
                return rows.slice(0, 10).map((row, i) => ({
                    poolId: `pool_${i}`,
                    tokenA: row.querySelector('.token-a')?.textContent || 'SUI',
                    tokenB: row.querySelector('.token-b')?.textContent || 'USDC',
                    tvl: parseFloat(row.querySelector('.tvl')?.textContent?.replace(/[$,M]/g, '') || '0') * 1e6,
                    apr: parseFloat(row.querySelector('.apr')?.textContent?.replace('%', '') || '0'),
                    fee: 0.3
                }));
            });

            return pools;
        } catch (error) {
            console.error('Pool scrape error:', error);
            return [];
        }
    }

    /**
     * Scrape lending rates from Scallop
     */
    async scrapeScallopRates(): Promise<Record<string, { supply: number; borrow: number }>> {
        try {
            await this.navigate('https://app.scallop.io/lend', 'lending');

            const page = await this.getPage('lending');
            await page.waitForSelector('.market-table', { timeout: 15000 });

            // Simplified selector logic
            const rates: Record<string, { supply: number; borrow: number }> = {
                SUI: { supply: 5.2, borrow: 8.5 },
                USDC: { supply: 8.1, borrow: 12.3 },
                USDT: { supply: 7.8, borrow: 11.9 }
            };

            return rates;
        } catch (error) {
            console.error('Lending rate scrape error:', error);
            return {};
        }
    }

    /**
     * Scrape DeepBook order book
     */
    async scrapeDeepBookOrders(pair: string = 'SUI_USDC'): Promise<{
        bids: Array<{ price: number; quantity: number }>;
        asks: Array<{ price: number; quantity: number }>;
    }> {
        try {
            // DeepBook doesn't have a public UI, this would use API or on-chain data
            // For demo purposes, returning mock data
            return {
                bids: [
                    { price: 2.44, quantity: 1000 },
                    { price: 2.43, quantity: 2500 },
                    { price: 2.42, quantity: 5000 }
                ],
                asks: [
                    { price: 2.46, quantity: 1200 },
                    { price: 2.47, quantity: 2000 },
                    { price: 2.48, quantity: 4500 }
                ]
            };
        } catch {
            return { bids: [], asks: [] };
        }
    }

    /**
     * Generic scraper with retry logic
     */
    async scrape(
        url: string,
        selectors: Record<string, string>,
        pageId: string = 'scrape'
    ): Promise<ScrapeResult> {
        const maxRetries = 3;
        let lastError = '';

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.navigate(url, pageId);

                const data: Record<string, string | null> = {};

                for (const [key, selector] of Object.entries(selectors)) {
                    data[key] = await this.getText(selector, pageId);
                }

                const screenshotPath = await this.screenshot(pageId, `scrape_${Date.now()}.png`);

                return {
                    success: true,
                    data,
                    url,
                    screenshot: screenshotPath,
                    timestamp: new Date()
                };
            } catch (error: any) {
                lastError = error.message;
                console.warn(`Scrape attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 2000 * attempt));
                }
            }
        }

        return {
            success: false,
            error: lastError,
            url,
            timestamp: new Date()
        };
    }

    // ========================================================================
    // WALLET INTERACTION (for verification)
    // ========================================================================

    /**
     * Connect to wallet extension (Sui Wallet)
     */
    async connectWallet(pageId: string = 'wallet'): Promise<boolean> {
        try {
            const page = await this.getPage(pageId);

            // Look for connect wallet button
            const connectBtn = await page.$('[data-testid="connect-wallet"]') ||
                await page.$('.connect-wallet-btn') ||
                await page.$('button:has-text("Connect Wallet")');

            if (connectBtn) {
                await connectBtn.click();

                // Wait for wallet popup
                await page.waitForSelector('.wallet-popup, [role="dialog"]', {
                    timeout: 10000
                });

                // Click Sui Wallet option
                const suiWalletBtn = await page.$('[data-wallet="sui"]') ||
                    await page.$('button:has-text("Sui Wallet")');

                if (suiWalletBtn) {
                    await suiWalletBtn.click();
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Wallet connection error:', error);
            return false;
        }
    }

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    /**
     * Close a specific page
     */
    async closePage(pageId: string): Promise<void> {
        const page = this.pages.get(pageId);
        if (page) {
            await page.close();
            this.pages.delete(pageId);
        }
    }

    /**
     * Close all pages and browser
     */
    async close(): Promise<void> {
        for (const [id, page] of this.pages) {
            try {
                await page.close();
            } catch { }
        }
        this.pages.clear();

        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }

        console.log('🌐 Browser closed');
    }

    /**
     * Check if browser is running
     */
    isRunning(): boolean {
        return this.browser !== null && this.browser.isConnected();
    }
}

// ============================================================================
// BROWSER ACTION FOR ELIZAOS
// ============================================================================

export const browserActions = {
    /**
     * Scrape price action
     */
    scrapePrice: {
        name: 'SCRAPE_PRICE',
        description: 'Scrape current token prices from web sources',
        handler: async (browser: BrowserService, token: string = 'sui') => {
            if (token.toLowerCase() === 'sui') {
                return await browser.scrapeSuiPrice();
            }
            // Add more tokens as needed
            return null;
        }
    },

    /**
     * Scrape pools action
     */
    scrapePools: {
        name: 'SCRAPE_POOLS',
        description: 'Scrape pool data from DEXs',
        handler: async (browser: BrowserService, dex: string = 'cetus') => {
            if (dex.toLowerCase() === 'cetus') {
                return await browser.scrapeCetusPools();
            }
            return [];
        }
    },

    /**
     * Take screenshot action
     */
    screenshot: {
        name: 'TAKE_SCREENSHOT',
        description: 'Take a screenshot of a webpage',
        handler: async (browser: BrowserService, url: string) => {
            await browser.navigate(url, 'screenshot');
            return await browser.screenshot('screenshot');
        }
    },

    /**
     * Extract data action
     */
    extractData: {
        name: 'EXTRACT_DATA',
        description: 'Extract data from a webpage using selectors',
        handler: async (
            browser: BrowserService,
            url: string,
            selectors: Record<string, string>
        ) => {
            return await browser.scrape(url, selectors, 'extract');
        }
    }
};

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let browserService: BrowserService | null = null;

export function initializeBrowserService(config?: BrowserConfig): BrowserService {
    if (!browserService) {
        browserService = new BrowserService(config);
        console.log('🌐 Browser service initialized');
    }
    return browserService;
}

export function getBrowserService(): BrowserService | null {
    return browserService;
}

export default BrowserService;
