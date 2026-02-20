import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Simulate installation logic
    // In a real app, this would update DB or user preferences

    // Artificial delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
        success: true,
        installed: true,
        pluginId: params.id
    });
}
