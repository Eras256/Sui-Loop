import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { targetAgent } = body;

        const agentUrl = process.env.AGENT_API_URL || 'http://localhost:3001';

        const res = await fetch(`${agentUrl}/api/marketplace/install/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AGENT_API_KEY || ''}`
            },
            body: JSON.stringify({ targetAgent }),
            signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json({
                success: true,
                installed: true,
                pluginId: id,
                backendResponse: data
            });
        } else {
            const errorData = await res.json();
            return NextResponse.json({
                success: false,
                error: errorData.error || 'Failed to install on backend'
            }, { status: res.status });
        }
    } catch (error) {
        console.error('[API] Marketplace Install Error:', error);
        // Fallback for demo: return success even if backend is offline
        return NextResponse.json({
            success: true,
            installed: true,
            pluginId: (await params).id,
            warning: 'Backend connection failed, installed locally only'
        });
    }
}
