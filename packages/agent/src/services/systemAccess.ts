/**
 * SuiLoop System Access Service
 * 
 * Provides controlled system access capabilities:
 * - Shell command execution (sandboxed or full)
 * - File read/write operations
 * - Script execution
 * - Environment variable management
 * - Process management
 * 
 * Inspired by OpenClaw's full system access feature.
 * 
 * ⚠️ SECURITY WARNING: This service provides powerful capabilities.
 * Use with caution and implement proper access controls.
 */

import { spawn, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type AccessLevel = 'sandbox' | 'restricted' | 'full';

export interface SystemConfig {
    accessLevel: AccessLevel;
    workingDir?: string;
    allowedCommands?: string[];     // Whitelist for sandbox mode
    blockedCommands?: string[];     // Blacklist for restricted mode
    timeout?: number;               // Command timeout in ms
    maxOutputSize?: number;         // Max output buffer size
    allowedPaths?: string[];        // Paths accessible in sandbox
    env?: Record<string, string>;   // Additional environment variables
}

export interface CommandResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    duration: number;
    command: string;
}

export interface FileInfo {
    path: string;
    name: string;
    isDirectory: boolean;
    isFile: boolean;
    size: number;
    modifiedAt: Date;
    createdAt: Date;
}

export interface ProcessInfo {
    pid: number;
    command: string;
    startedAt: Date;
    status: 'running' | 'stopped' | 'killed';
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

const SANDBOX_ALLOWED_COMMANDS = [
    'ls', 'cat', 'head', 'tail', 'wc',
    'grep', 'find', 'echo', 'pwd', 'date',
    'node', 'npm', 'pnpm', 'yarn',
    'sui', 'curl', 'jq'
];

const RESTRICTED_BLOCKED_COMMANDS = [
    'rm -rf /', 'mkfs', 'dd if=/dev/zero',
    'shutdown', 'reboot', 'halt',
    'chmod 777 /', 'chown -R',
    'sudo su', 'passwd'
];

// ============================================================================
// SYSTEM ACCESS SERVICE
// ============================================================================

export class SystemAccessService extends EventEmitter {
    private config: SystemConfig;
    private processes: Map<string, ChildProcess> = new Map();
    private processInfo: Map<string, ProcessInfo> = new Map();
    private commandHistory: CommandResult[] = [];

    constructor(config: Partial<SystemConfig> = {}) {
        super();

        this.config = {
            accessLevel: config.accessLevel || 'restricted',
            workingDir: config.workingDir || process.cwd(),
            timeout: config.timeout || 30000,
            maxOutputSize: config.maxOutputSize || 10 * 1024 * 1024, // 10MB
            allowedCommands: config.allowedCommands || SANDBOX_ALLOWED_COMMANDS,
            blockedCommands: config.blockedCommands || RESTRICTED_BLOCKED_COMMANDS,
            allowedPaths: config.allowedPaths || [process.cwd()],
            env: config.env || {}
        };
    }

    // ========================================================================
    // SHELL COMMANDS
    // ========================================================================

    /**
     * Execute a shell command
     */
    async execute(command: string, cwd?: string): Promise<CommandResult> {
        const startTime = Date.now();

        // Validate command based on access level
        const validation = this.validateCommand(command);
        if (!validation.valid) {
            return {
                success: false,
                stdout: '',
                stderr: `Command blocked: ${validation.reason}`,
                exitCode: 1,
                duration: Date.now() - startTime,
                command
            };
        }

        try {
            this.emit('command:start', { command, cwd });

            const { stdout, stderr } = await execAsync(command, {
                cwd: cwd || this.config.workingDir,
                timeout: this.config.timeout,
                maxBuffer: this.config.maxOutputSize,
                env: { ...process.env, ...this.config.env }
            });

            const result: CommandResult = {
                success: true,
                stdout: stdout.slice(0, this.config.maxOutputSize!),
                stderr: stderr.slice(0, this.config.maxOutputSize!),
                exitCode: 0,
                duration: Date.now() - startTime,
                command
            };

            this.commandHistory.push(result);
            this.emit('command:complete', result);

            return result;
        } catch (error: any) {
            const result: CommandResult = {
                success: false,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.code || 1,
                duration: Date.now() - startTime,
                command
            };

            this.commandHistory.push(result);
            this.emit('command:error', result);

            return result;
        }
    }

    /**
     * Execute a command in the background
     */
    async executeBackground(
        command: string,
        args: string[] = [],
        cwd?: string
    ): Promise<string> {
        const validation = this.validateCommand(command);
        if (!validation.valid) {
            throw new Error(`Command blocked: ${validation.reason}`);
        }

        const processId = crypto.randomUUID();

        const child = spawn(command, args, {
            cwd: cwd || this.config.workingDir,
            env: { ...process.env, ...this.config.env },
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        this.processes.set(processId, child);
        this.processInfo.set(processId, {
            pid: child.pid!,
            command: `${command} ${args.join(' ')}`,
            startedAt: new Date(),
            status: 'running'
        });

        // Handle process events
        child.on('exit', (code) => {
            const info = this.processInfo.get(processId);
            if (info) info.status = 'stopped';
            this.emit('process:exit', { processId, code });
        });

        child.on('error', (error) => {
            this.emit('process:error', { processId, error: error.message });
        });

        this.emit('process:start', { processId, command, pid: child.pid });

        return processId;
    }

    /**
     * Kill a background process
     */
    killProcess(processId: string): boolean {
        const child = this.processes.get(processId);
        if (!child) return false;

        child.kill('SIGTERM');

        const info = this.processInfo.get(processId);
        if (info) info.status = 'killed';

        this.processes.delete(processId);
        this.emit('process:killed', { processId });

        return true;
    }

    /**
     * Get process output
     */
    async getProcessOutput(processId: string): Promise<string> {
        const child = this.processes.get(processId);
        if (!child || !child.stdout) return '';

        return new Promise((resolve) => {
            let output = '';
            child.stdout?.on('data', (data) => {
                output += data.toString();
            });

            setTimeout(() => resolve(output), 1000);
        });
    }

    /**
     * Get all running processes
     */
    getRunningProcesses(): ProcessInfo[] {
        return Array.from(this.processInfo.values())
            .filter(p => p.status === 'running');
    }

    /**
     * Validate command based on access level
     */
    private validateCommand(command: string): { valid: boolean; reason?: string } {
        if (this.config.accessLevel === 'full') {
            return { valid: true };
        }

        const commandBase = command.split(' ')[0];

        if (this.config.accessLevel === 'sandbox') {
            if (!this.config.allowedCommands?.includes(commandBase)) {
                return {
                    valid: false,
                    reason: `Command '${commandBase}' not in allowed list`
                };
            }
        }

        if (this.config.accessLevel === 'restricted') {
            for (const blocked of this.config.blockedCommands || []) {
                if (command.includes(blocked)) {
                    return {
                        valid: false,
                        reason: `Command contains blocked pattern: ${blocked}`
                    };
                }
            }
        }

        return { valid: true };
    }

    // ========================================================================
    // FILE OPERATIONS
    // ========================================================================

    /**
     * Read a file
     */
    async readFile(filePath: string): Promise<string> {
        this.validatePath(filePath);

        const fullPath = this.resolvePath(filePath);
        const content = await fs.readFile(fullPath, 'utf-8');

        this.emit('file:read', { path: fullPath, size: content.length });

        return content;
    }

    /**
     * Write to a file
     */
    async writeFile(filePath: string, content: string): Promise<void> {
        this.validatePath(filePath);

        if (this.config.accessLevel === 'sandbox') {
            throw new Error('File writing not allowed in sandbox mode');
        }

        const fullPath = this.resolvePath(filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content, 'utf-8');

        this.emit('file:write', { path: fullPath, size: content.length });
    }

    /**
     * Append to a file
     */
    async appendFile(filePath: string, content: string): Promise<void> {
        this.validatePath(filePath);

        if (this.config.accessLevel === 'sandbox') {
            throw new Error('File writing not allowed in sandbox mode');
        }

        const fullPath = this.resolvePath(filePath);
        await fs.appendFile(fullPath, content, 'utf-8');

        this.emit('file:append', { path: fullPath, size: content.length });
    }

    /**
     * Check if file/directory exists
     */
    async exists(filePath: string): Promise<boolean> {
        const fullPath = this.resolvePath(filePath);
        return fs.pathExists(fullPath);
    }

    /**
     * Get file/directory info
     */
    async stat(filePath: string): Promise<FileInfo> {
        const fullPath = this.resolvePath(filePath);
        const stats = await fs.stat(fullPath);

        return {
            path: fullPath,
            name: path.basename(fullPath),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            size: stats.size,
            modifiedAt: stats.mtime,
            createdAt: stats.birthtime
        };
    }

    /**
     * List directory contents
     */
    async listDir(dirPath: string): Promise<FileInfo[]> {
        this.validatePath(dirPath);

        const fullPath = this.resolvePath(dirPath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        const results: FileInfo[] = [];

        for (const entry of entries) {
            const entryPath = path.join(fullPath, entry.name);
            try {
                const stats = await fs.stat(entryPath);
                results.push({
                    path: entryPath,
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    isFile: entry.isFile(),
                    size: stats.size,
                    modifiedAt: stats.mtime,
                    createdAt: stats.birthtime
                });
            } catch { }
        }

        this.emit('dir:list', { path: fullPath, count: results.length });

        return results;
    }

    /**
     * Create directory
     */
    async mkdir(dirPath: string): Promise<void> {
        this.validatePath(dirPath);

        if (this.config.accessLevel === 'sandbox') {
            throw new Error('Directory creation not allowed in sandbox mode');
        }

        const fullPath = this.resolvePath(dirPath);
        await fs.ensureDir(fullPath);

        this.emit('dir:create', { path: fullPath });
    }

    /**
     * Delete file or directory
     */
    async remove(filePath: string): Promise<void> {
        this.validatePath(filePath);

        if (this.config.accessLevel !== 'full') {
            throw new Error('Deletion only allowed in full access mode');
        }

        const fullPath = this.resolvePath(filePath);
        await fs.remove(fullPath);

        this.emit('file:remove', { path: fullPath });
    }

    /**
     * Copy file or directory
     */
    async copy(src: string, dest: string): Promise<void> {
        this.validatePath(src);
        this.validatePath(dest);

        if (this.config.accessLevel === 'sandbox') {
            throw new Error('Copy not allowed in sandbox mode');
        }

        const srcPath = this.resolvePath(src);
        const destPath = this.resolvePath(dest);

        await fs.copy(srcPath, destPath);

        this.emit('file:copy', { src: srcPath, dest: destPath });
    }

    /**
     * Move file or directory
     */
    async move(src: string, dest: string): Promise<void> {
        this.validatePath(src);
        this.validatePath(dest);

        if (this.config.accessLevel === 'sandbox') {
            throw new Error('Move not allowed in sandbox mode');
        }

        const srcPath = this.resolvePath(src);
        const destPath = this.resolvePath(dest);

        await fs.move(srcPath, destPath);

        this.emit('file:move', { src: srcPath, dest: destPath });
    }

    /**
     * Search for files
     */
    async findFiles(
        pattern: string,
        directory?: string
    ): Promise<string[]> {
        const dir = directory || this.config.workingDir!;
        this.validatePath(dir);

        const result = await this.execute(`find ${dir} -name "${pattern}" -type f`, dir);

        if (!result.success) return [];

        return result.stdout
            .split('\n')
            .filter(line => line.trim())
            .slice(0, 1000); // Limit results
    }

    /**
     * Search file contents
     */
    async grepFiles(
        pattern: string,
        directory?: string,
        filePattern?: string
    ): Promise<Array<{ file: string; line: number; content: string }>> {
        const dir = directory || this.config.workingDir!;
        this.validatePath(dir);

        let command = `grep -rn "${pattern}" ${dir}`;
        if (filePattern) {
            command += ` --include="${filePattern}"`;
        }
        command += ' 2>/dev/null | head -100';

        const result = await this.execute(command, dir);

        if (!result.success || !result.stdout) return [];

        return result.stdout
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const match = line.match(/^(.+?):(\d+):(.*)$/);
                if (match) {
                    return {
                        file: match[1],
                        line: parseInt(match[2]),
                        content: match[3]
                    };
                }
                return null;
            })
            .filter((x): x is { file: string; line: number; content: string } => x !== null);
    }

    /**
     * Validate path access
     */
    private validatePath(filePath: string): void {
        if (this.config.accessLevel === 'full') return;

        const fullPath = this.resolvePath(filePath);
        const allowedPaths = this.config.allowedPaths || [];

        const isAllowed = allowedPaths.some(allowed =>
            fullPath.startsWith(path.resolve(allowed))
        );

        if (!isAllowed) {
            throw new Error(`Access denied: ${filePath} is outside allowed paths`);
        }
    }

    /**
     * Resolve path relative to working directory
     */
    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.resolve(this.config.workingDir!, filePath);
    }

    // ========================================================================
    // ENVIRONMENT
    // ========================================================================

    /**
     * Get environment variable
     */
    getEnv(key: string): string | undefined {
        return this.config.env?.[key] || process.env[key];
    }

    /**
     * Set environment variable (for this service only)
     */
    setEnv(key: string, value: string): void {
        if (!this.config.env) this.config.env = {};
        this.config.env[key] = value;
    }

    /**
     * Get all environment variables
     */
    getAllEnv(): Record<string, string | undefined> {
        return { ...process.env, ...this.config.env };
    }

    // ========================================================================
    // SCRIPTS
    // ========================================================================

    /**
     * Execute a script file
     */
    async executeScript(
        scriptPath: string,
        args: string[] = []
    ): Promise<CommandResult> {
        this.validatePath(scriptPath);

        const fullPath = this.resolvePath(scriptPath);
        const ext = path.extname(fullPath);

        let command: string;

        switch (ext) {
            case '.sh':
                command = `bash ${fullPath} ${args.join(' ')}`;
                break;
            case '.js':
            case '.mjs':
                command = `node ${fullPath} ${args.join(' ')}`;
                break;
            case '.ts':
                command = `npx tsx ${fullPath} ${args.join(' ')}`;
                break;
            case '.py':
                command = `python3 ${fullPath} ${args.join(' ')}`;
                break;
            default:
                command = `${fullPath} ${args.join(' ')}`;
        }

        return this.execute(command);
    }

    /**
     * Execute inline script
     */
    async executeInlineScript(
        code: string,
        language: 'bash' | 'node' | 'python' = 'bash'
    ): Promise<CommandResult> {
        if (this.config.accessLevel === 'sandbox') {
            throw new Error('Inline script execution not allowed in sandbox mode');
        }

        let command: string;

        switch (language) {
            case 'node':
                command = `node -e "${code.replace(/"/g, '\\"')}"`;
                break;
            case 'python':
                command = `python3 -c "${code.replace(/"/g, '\\"')}"`;
                break;
            case 'bash':
            default:
                command = code;
        }

        return this.execute(command);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Get command history
     */
    getHistory(limit: number = 50): CommandResult[] {
        return this.commandHistory.slice(-limit);
    }

    /**
     * Clear command history
     */
    clearHistory(): void {
        this.commandHistory = [];
    }

    /**
     * Get system info
     */
    async getSystemInfo(): Promise<Record<string, any>> {
        const [uname, memory, disk] = await Promise.all([
            this.execute('uname -a'),
            this.execute('free -h 2>/dev/null || vm_stat'),
            this.execute('df -h .')
        ]);

        return {
            os: uname.stdout.trim(),
            memory: memory.stdout.trim(),
            disk: disk.stdout.trim(),
            workingDir: this.config.workingDir,
            accessLevel: this.config.accessLevel
        };
    }

    /**
     * Check if a command is available
     */
    async commandExists(command: string): Promise<boolean> {
        const result = await this.execute(`which ${command} 2>/dev/null`);
        return result.success && result.stdout.trim().length > 0;
    }
}

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let systemService: SystemAccessService | null = null;

export function initializeSystemAccess(config?: Partial<SystemConfig>): SystemAccessService {
    if (!systemService) {
        systemService = new SystemAccessService(config);
        console.log(`💻 System Access initialized (${config?.accessLevel || 'restricted'} mode)`);
    }
    return systemService;
}

export function getSystemService(): SystemAccessService | null {
    return systemService;
}

export default SystemAccessService;
