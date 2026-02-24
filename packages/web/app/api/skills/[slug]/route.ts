import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(req.url);
        const agentId = searchParams.get('agentId');

        const agentUrl = process.env.AGENT_API_URL || 'http://localhost:3001';

        let endpoint = `${agentUrl}/api/skills/${slug}`;
        if (agentId) {
            endpoint += `?agentId=${agentId}`;
        }

        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${process.env.AGENT_API_KEY || ''}` },
            signal: AbortSignal.timeout(2500)
        });

        if (res.ok) {
            return NextResponse.json({ success: true, message: 'Uninstalled from backend' });
        } else {
            const data = await res.json();
            return NextResponse.json({ success: false, error: data.error || 'Backend uninstall failed' }, { status: res.status });
        }
    } catch (error) {
        console.error('[API] Skills DELETE Error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
