import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:3001';

program
    .name('suiloop')
    .description('SuiLoop CLI — Command Center for your Atomic DeFi Agent')
    .version('0.0.8');

// ============================================================================
// AGENT MANAGEMENT (Create)
// ============================================================================

program
    .command('create')
    .description('Create a new autonomous agent')
    .action(async () => {
        console.log(chalk.cyanBright(`
   _____       _ __                    
  / ___/__  __(_) /  ____  ____  ____ 
  \\__ \\/ / / / / /  / __ \\/ __ \\/ __ \\
 ___/ / /_/ / / /__/ /_/ / /_/ / /_/ /
/____/\\__,_/_/_____/\\____/\\____/ .___/ 
                              /_/      
    `));
        console.log(chalk.bold('🚀 Welcome to the SuiLoop Agent Factory\n'));

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of your agent?',
                default: 'my-killer-bot'
            },
            {
                type: 'list',
                name: 'language',
                message: 'Which language do you prefer?',
                choices: ['TypeScript', 'Python']
            },
            {
                type: 'input',
                name: 'apiKey',
                message: 'Paste your API Key:',
                validate: (input) => input.startsWith('sk_') ? true : 'Invalid API Key format'
            }
        ]);

        const spinner = ora('Injecting neural pathways...').start();

        try {
            const targetDir = path.join(process.cwd(), answers.name);
            const templateDir = path.join(__dirname, 'templates', answers.language === 'TypeScript' ? 'ts' : 'py');

            // Copy template
            await fs.copy(templateDir, targetDir);

            // Create .env
            const envContent = `SUILOOP_API_KEY=${answers.apiKey}\n`;
            await fs.writeFile(path.join(targetDir, '.env'), envContent);

            // Update package.json name if TS
            if (answers.language === 'TypeScript') {
                const pkgPath = path.join(targetDir, 'package.json');
                const pkg = await fs.readJson(pkgPath);
                pkg.name = answers.name;
                await fs.writeJson(pkgPath, pkg, { spaces: 2 });
            }

            spinner.succeed(chalk.green('Agent successfully incubated! 🥚'));

            console.log('\nTo wake up your agent:\n');
            console.log(chalk.cyan(`  cd ${answers.name}`));

            if (answers.language === 'TypeScript') {
                console.log(chalk.cyan('  npm install'));
                console.log(chalk.cyan('  npm start'));
            } else {
                console.log(chalk.cyan('  pip install -r requirements.txt'));
                console.log(chalk.cyan('  python main.py'));
            }
            console.log('\nHappy hunting! 🏹');

        } catch (error) {
            spinner.fail(chalk.red('Failed to create agent'));
            console.error(error);
        }
    });

// ============================================================================
// DIAGNOSTICS & CONTROL (Reference Implementation)
// ============================================================================

program
    .command('health')
    .description('Check the pulse of the running agent')
    .action(async () => {
        try {
            const { data } = await axios.get(`${AGENT_URL}/api/health`);

            if (data.status === 'healthy') {
                console.log(chalk.green(`✅ Agent is ONLINE (Uptime: ${formatUptime(data.uptime)})`));
            } else if (data.status === 'degraded') {
                console.log(chalk.yellow(`⚠️ Agent is DEGRADED (Uptime: ${formatUptime(data.uptime)})`));
            } else {
                console.log(chalk.red(`🚨 Agent is CRITICAL`));
            }
        } catch (error) {
            console.log(chalk.red('❌ Could not connect to agent. Is it running?'));
        }
    });

program
    .command('info')
    .description('Show agent capabilities and endpoints')
    .action(async () => {
        try {
            const { data } = await axios.get(`${AGENT_URL}/api/info`);
            console.log(chalk.bold(`\n🤖 ${data.name} v${data.version}`));
            console.log(chalk.gray('----------------------------------------'));
            console.log(chalk.blue('Features:'));
            data.features.forEach((f: string) => console.log(`  • ${f}`));
            console.log(chalk.blue('\nPublic API:'));
            data.endpoints.public.forEach((e: string) => console.log(`  • ${e}`));
            console.log('');
        } catch (error) {
            console.log(chalk.red('❌ Could not connect to agent.'));
        }
    });

program
    .command('doctor')
    .description('Run a deep system diagnosis (Requires Auth)')
    .option('-k, --key <key>', 'Admin API Key')
    .action(async (options) => {
        let apiKey = options.key;

        if (!apiKey && process.env.SUILOOP_API_KEY) {
            apiKey = process.env.SUILOOP_API_KEY;
        }

        if (!apiKey) {
            const answer = await inquirer.prompt([{
                type: 'password',
                name: 'key',
                message: 'Enter Admin API Key:'
            }]);
            apiKey = answer.key;
        }

        const spinner = ora('👩‍⚕️ Performing checkup...').start();

        try {
            const { data } = await axios.get(`${AGENT_URL}/api/doctor`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            spinner.stop();
            console.log('\n' + chalk.bold.underline('System Diagnosis Report'));

            // Status
            const statusColor = data.status === 'healthy' ? chalk.green : (data.status === 'degraded' ? chalk.yellow : chalk.red);
            console.log(`Status: ${statusColor(data.status.toUpperCase())}`);
            console.log(`Time:   ${new Date(data.timestamp).toLocaleString()}`);

            console.log(chalk.white('\n[System Resources]'));
            console.log(`  CPU Load:    ${data.components.system.cpuLoad.toFixed(2)}`);
            console.log(`  Memory Free: ${data.components.system.memoryFree} MB`);

            console.log(chalk.white('\n[Sui Network]'));
            const net = data.components.network;
            const netColor = net.status === 'connected' ? chalk.green : chalk.red;
            console.log(`  Status:   ${netColor(net.status)}`);
            console.log(`  Latency:  ${net.latencyMs}ms`);
            console.log(`  Checkpoint: ${net.latestCheckpoint}`);

            console.log(chalk.white('\n[LLM Core]'));
            const llm = data.components.llm;
            const llmColor = llm.status === 'connected' ? chalk.green : chalk.red;
            console.log(`  Provider: ${llm.provider}`);
            console.log(`  Status:   ${llmColor(llm.status)}`);

            console.log(chalk.white('\n[Wallet]'));
            const wallet = data.components.wallet;
            const walletColor = wallet.hasGas ? chalk.green : chalk.red;
            console.log(`  Gas:      ${walletColor(wallet.hasGas ? 'OK' : 'EMPTY')}`);

        } catch (error: any) {
            spinner.fail('Diagnosis failed');
            if (error.response?.status === 401) {
                console.log(chalk.red('⛔ Unauthorized. Please check your API Key.'));
            } else {
                console.log(chalk.red(`❌ Error: ${error.message}`));
            }
        }
    });

// ============================================================================
// MARKET DATA
// ============================================================================

program
    .command('market')
    .description('Fetch live market state: SUI price, gas, APYs, DeepBook liquidity')
    .option('-k, --key <key>', 'API Key')
    .action(async (options) => {
        const apiKey = options.key || process.env.SUILOOP_API_KEY || '';
        const spinner = ora('Fetching live market data...').start();
        try {
            const { data } = await axios.get(`${AGENT_URL}/api/market`, {
                headers: { 'x-api-key': apiKey }
            });
            spinner.stop();
            // Normalize: server returns { success, market: {...} } shape
            const m = data.market || data;
            console.log(chalk.bold('\n📊 SuiLoop Live Market State'));
            console.log(chalk.gray('─'.repeat(38)));
            console.log(`  SUI Price:         ${chalk.cyan('$' + (m.suiPrice || 'N/A'))}`);
            console.log(`  Gas:               ${chalk.yellow((m.gasPrice || 'N/A') + ' MIST')}`);
            console.log(`  DeepBook Liq:      ${chalk.green('$' + (m.deepBookLiquidity || 0).toLocaleString())}`);
            console.log(`  Scallop SUI APY:   ${chalk.magenta((m.scallopApy?.supply || 'N/A') + '% supply / ' + (m.scallopApy?.borrow || 'N/A') + '% borrow')}`);
            console.log(`  Navi USDC APY:     ${chalk.blue((m.naviUsdcApy?.supply || 'N/A') + '% supply / ' + (m.naviUsdcApy?.borrow || 'N/A') + '% borrow')}`);
            console.log(`  LLM Engine:        ${m.llmEnabled ? chalk.green('ACTIVE ✅') : chalk.gray('offline')}`);
            console.log(`  Last Update:       ${m.lastUpdate ? new Date(m.lastUpdate).toLocaleTimeString() : 'N/A'}`);
            console.log('');
        } catch (error: any) {
            spinner.fail(chalk.red('Market data unavailable — is the agent running?'));
        }
    });

// ============================================================================
// AUTONOMOUS LOOP CONTROL
// ============================================================================

program
    .command('loop <action>')
    .description('Control the autonomous market scanner (start | stop | status)')
    .option('-k, --key <key>', 'API Key')
    .option('--min-profit <n>', 'Minimum profit % threshold', '0.1')
    .option('--max-gas <n>', 'Maximum gas price in MIST', '3000')
    .action(async (action: string, options) => {
        const apiKey = options.key || process.env.SUILOOP_API_KEY || '';
        const headers = { 'x-api-key': apiKey };

        if (!['start', 'stop', 'status'].includes(action)) {
            console.log(chalk.red(`Unknown action: '${action}'. Use start | stop | status`));
            return;
        }

        const spinner = ora(`${action === 'start' ? '🟢 Starting' : action === 'stop' ? '🔴 Stopping' : '🟡 Fetching'} autonomous loop...`).start();

        try {
            if (action === 'status') {
                const { data } = await axios.get(`${AGENT_URL}/api/loop/status`, { headers });
                spinner.stop();
                const running = data.isRunning;
                console.log(`\n  Loop Status: ${running ? chalk.green('RUNNING ⚡') : chalk.gray('STOPPED ⏹️')}`);
                console.log(`  Total Scans: ${data.scanCount || 0}`);
                console.log(`  Signals Emitted: ${data.signalsEmitted || 0}`);
                console.log('');
            } else if (action === 'start') {
                const { data } = await axios.post(`${AGENT_URL}/api/loop/start`, {
                    config: {
                        minProfitPercentage: parseFloat(options.minProfit),
                        maxGasPrice: parseInt(options.maxGas)
                    }
                }, { headers });
                spinner.succeed(chalk.green(`🟢 Loop started! Min profit: ${options.minProfit}% | Max gas: ${options.maxGas} MIST`));
            } else {
                await axios.post(`${AGENT_URL}/api/loop/stop`, {}, { headers });
                spinner.succeed(chalk.yellow('🔴 Loop stopped.'));
            }
        } catch (error: any) {
            spinner.fail(chalk.red(`Loop ${action} failed: ${error.message}`));
        }
    });

// ============================================================================
// STRATEGY EXECUTION
// ============================================================================

program
    .command('execute')
    .description('Execute a strategy on-chain')
    .option('-k, --key <key>', 'API Key')
    .option('-s, --strategy <id>', 'Strategy ID', 'atomic-flash-loan')
    .option('-a, --asset <asset>', 'Asset: SUI or USDC', 'SUI')
    .option('--amount <n>', 'Amount to loop', '0.1')
    .action(async (options) => {
        const apiKey = options.key || process.env.SUILOOP_API_KEY || '';
        if (!apiKey) {
            console.log(chalk.red('No API key. Set SUILOOP_API_KEY or use --key'));
            return;
        }
        const spinner = ora(`⚡ Executing ${options.strategy} on ${options.asset}...`).start();
        try {
            const { data } = await axios.post(
                `${AGENT_URL}/api/execute`,
                { strategy: options.strategy, asset: options.asset, params: { amount: parseFloat(options.amount) } },
                { headers: { 'x-api-key': apiKey }, timeout: 60000 }
            );
            if (data.success) {
                spinner.succeed(chalk.green(`🎉 Execution SUCCESS`));
                if (data.txHash) {
                    console.log(`  TX Hash:  ${chalk.cyan(data.txHash)}`);
                    console.log(`  SuiScan:  ${chalk.underline.blue('https://suiscan.xyz/testnet/tx/' + data.txHash)}`);
                }
                if (data.profit) console.log(`  Yield:    ${chalk.green(data.profit)}`);
            } else {
                spinner.fail(chalk.yellow(`⚠️  Execution incomplete: ${data.error || 'Unknown'}`))
            }
        } catch (error: any) {
            spinner.fail(chalk.red(`Execution failed: ${error.response?.data?.error || error.message}`));
        }
    });

function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

program.parse(process.argv);

