'use client';

export function PremiumAtmosphere() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Main Light Points */}
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-neon-cyan/15 blur-[140px] rounded-full animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-neon-purple/15 blur-[140px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[65%] bg-blue-500/10 blur-[160px] rounded-full"></div>

            {/* Floating Light Spears */}
            <div className="absolute top-1/4 right-[20%] w-[1px] h-[400px] bg-gradient-to-b from-transparent via-vibrant-cyan to-transparent rotate-45 animate-float opacity-30"></div>
            <div className="absolute bottom-1/4 left-[20%] w-[1px] h-[400px] bg-gradient-to-b from-transparent via-vibrant-purple to-transparent -rotate-45 animate-float opacity-30" style={{ animationDelay: '2s' }}></div>

            {/* Subtle Scanning Line */}
            <div className="absolute inset-0 bg-scan-line opacity-[0.02] pointer-events-none"></div>

            {/* Grain Layer */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>
        </div>
    );
}
