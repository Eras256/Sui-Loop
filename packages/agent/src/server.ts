import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { executeAtomicLeverage } from './actions/executeAtomicLeverage.js';
import { executeBuilderStrategy } from './actions/executeBuilderStrategy.js';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

// Extract the Insert type for easier usage/casting
type AgentLogInsert = Database['public']['Tables']['agent_logs']['Insert'];

dotenv.config();

// Initialize Supabase Client (if configured)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (supabaseUrl && supabaseKey)
    ? createClient<Database>(supabaseUrl, supabaseKey)
    : null;

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock runtime for now (same as run.ts)
const mockRuntime = {
    getSetting: (key: string): string | undefined => {
        return process.env[key];
    },
    composeState: async () => ({}),
};

/**
 * Health Check
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', agent: 'SuiLoop Agent v0.0.4' });
});

/**
 * EXECUTE STRATEGY
 * POST /api/execute
 * Body: { strategy: string, params: object }
 */
app.post('/api/execute', async (req: Request, res: Response) => {
    const { strategy, params } = req.body;

    console.log(`\n🚀 Received execution request for: ${strategy}`);
    console.log(`   Params:`, params);

    // 1. Log Start to DB
    let logId: string | undefined;
    if (supabase) {
        const { data, error } = await supabase
            .from('agent_logs')
            .insert({
                level: 'info',
                message: `Starting execution: ${strategy}`,
                details: params
            } as any)
            .select()
            .single();

        if (data) logId = (data as any).id;
        if (error) console.error("Supabase Log Error:", error);
    }

    // Mock message
    const mockMessage = {
        content: {
            text: `Execute ${strategy}`
        },
        userId: "api-user",
        agentId: "suiloop-agent",
        roomId: "api-room",
    };

    try {
        // Validation
        const isValid = await executeAtomicLeverage.validate(
            mockRuntime as any,
            mockMessage as any
        );

        if (!isValid) {
            return res.status(400).json({ success: false, error: 'Validation failed for strategy' });
        }

        // Determine Handler
        const isCustomBuilder = params && params.config && params.config.nodes && params.config.nodes.length > 0;
        const handlerToUse = isCustomBuilder ? executeBuilderStrategy : executeAtomicLeverage;

        // Custom Prep
        if (isCustomBuilder) {
            // Inject nodes into mockMessage for the handler
            (mockMessage.content as any).nodes = params.config.nodes;
            (mockMessage.content as any).strategyName = params.config.displayName || strategy;
        }

        // Execution
        // We capture logs specifically for this request
        const logs: string[] = [];
        const callback = async (response: { text: string; content?: unknown }) => {
            logs.push(response.text);
            if (response.content) logs.push(JSON.stringify(response.content));
            return [];
        };

        const result = await handlerToUse.handler(
            mockRuntime as any,
            mockMessage as any,
            undefined,
            {},
            callback as any
        );

        res.json({
            success: true,
            result,
            logs
        });

        // 2. Log Success to DB
        if (supabase && logId) {
            await supabase
                .from('agent_logs')
                .insert({
                    strategy_id: null, // Could link to strategy if we had the ID
                    level: 'success',
                    message: `Execution successful: ${strategy}`,
                    details: { result, logs }
                } as any);
        }

    } catch (error) {
        console.error("Execution error:", error);

        // 3. Log Error to DB
        if (supabase) {
            await supabase
                .from('agent_logs')
                .insert({
                    level: 'error',
                    message: `Execution failed: ${strategy}`,
                    details: { error: String(error) }
                } as any);
        }

        res.status(500).json({ success: false, error: String(error) });
    }
});

app.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║             🚀 SUILOOP AGENT API SERVER                   ║
║             Listening on port ${port}                        ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
