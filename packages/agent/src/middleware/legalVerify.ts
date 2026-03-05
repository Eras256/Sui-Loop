/**
 * Legal Compliance Middleware
 * Ensures users have cryptographically signed the Terms of Service
 * before accessing sensitive autonomous execution endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabaseService.js';

export async function legalVerifyMiddleware(req: Request, res: Response, next: NextFunction) {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
        return res.status(403).json({
            success: false,
            error: 'Legal consent required',
            code: 'MISSING_WALLET_HEADER',
            message: 'All requests must include [x-wallet-address] to verify legal standing.'
        });
    }

    if (!supabase) {
        // Fallback for isolated environments where Supabase is not configured
        console.warn('⚠️ Supabase not available for legal verification. Passing through (DEVELOPMENT ONLY).');
        return next();
    }

    try {
        const { data, error } = await supabase
            .from('user_signatures')
            .select('signature_hash')
            .eq('wallet_address', walletAddress)
            .eq('network', 'sui:testnet')
            .single();

        if (error || !data) {
            return res.status(403).json({
                success: false,
                error: 'Legal access blocked',
                code: 'TERMS_NOT_SIGNED',
                message: 'No cryptographic record found for this wallet. You must sign the Terms of Service in the UI before executing autonomous operations.',
                wallet: walletAddress
            });
        }

        // Signature found, proceed to next middleware/handler
        next();
    } catch (err: any) {
        console.error('Critical failure in legal verification:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal verification failure',
            message: err.message
        });
    }
}
