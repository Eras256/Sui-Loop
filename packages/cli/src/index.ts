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
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:3000';

program
    .name('suiloop')
    .description('SuiLoop CLI - The Command Center for your DeFi Agent')
    .version('0.2.0');

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

function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

program.parse(process.argv);
