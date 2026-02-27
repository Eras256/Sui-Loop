"use client";
import React, { useState, useEffect } from 'react'; import { supabase } from '@/lib/supabase';

// Real hook connecting to Agent Runtime via Supabase
export function useAgent() {
    const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'EXECUTING'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (!supabase) return;

        let idleTimer: NodeJS.Timeout;

        // Fetch initial recent logs
        const fetchInitial = async () => {
            const { data } = await supabase!.from('logs').select('message, level').order('timestamp', { ascending: false }).limit(5);
            if (data && data.length > 0) {
                setLogs(data.map((l: any) => l.message));
                setStatus('ANALYZING');
                idleTimer = setTimeout(() => setStatus('IDLE'), 10000);
            }
        };
        fetchInitial();

        // Subscribe to real-time logs
        const channel = supabase!
            .channel('agent-orb-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
                const newLog = payload.new as any;
                setLogs(prev => [newLog.message, ...prev].slice(0, 5));

                clearTimeout(idleTimer);
                if (newLog.level === 'success' || newLog.message.includes('Executing')) {
                    setStatus('EXECUTING');
                    idleTimer = setTimeout(() => setStatus('IDLE'), 8000); // executed state lasts a bit
                } else {
                    setStatus('ANALYZING');
                    idleTimer = setTimeout(() => setStatus('IDLE'), 5000);
                }
            })
            .subscribe();

        return () => {
            clearTimeout(idleTimer);
            supabase!.removeChannel(channel);
        };
    }, []);

    return { status, logs };
}
