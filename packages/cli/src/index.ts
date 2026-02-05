import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
    .name('suiloop')
    .description('The official SuiLoop Agent Generator')
    .version('0.1.0');

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
                message: 'Paste your API Key (get one at http://localhost:3000/agents):',
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

program.parse(process.argv);
