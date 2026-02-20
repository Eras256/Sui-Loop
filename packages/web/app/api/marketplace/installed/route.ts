import { NextResponse } from 'next/server';

export async function GET() {
    // Mock response for demo purposes
    // Returns a list of default installed skills if any
    return NextResponse.json({
        success: true,
        skills: []
    });
}
