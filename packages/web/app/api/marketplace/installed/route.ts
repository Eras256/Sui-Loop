import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get('agentId');

        const agentUrl = process.env.AGENT_API_URL || 'http://localhost:3001';

        // Use the agent-aware endpoint if agentId is provided
        const endpoint = agentId
            ? `${agentUrl}/api/marketplace/installed?agentId=${agentId}`
            : `${agentUrl}/api/skills`;

        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${process.env.AGENT_API_KEY || ''}` },
            signal: AbortSignal.timeout(2500)
        });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json({
                success: true,
                skills: data.skills || []
            });
        }
    } catch (error) {
        console.error('[API] Marketplace Installed Error:', error);
    }

    return NextResponse.json({ success: true, skills: [] });
}
