export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    wallet_address: string | null
                    username: string | null
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    wallet_address?: string | null
                    username?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string | null
                    username?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
            }
            strategies: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    config: Json
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    config: Json
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    config?: Json
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            agent_logs: {
                Row: {
                    id: string
                    strategy_id: string | null
                    level: string
                    message: string
                    details: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    strategy_id?: string | null
                    level: string
                    message: string
                    details?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    strategy_id?: string | null
                    level?: string
                    message?: string
                    details?: Json | null
                    created_at?: string
                }
            }
            user_signatures: {
                Row: {
                    id: string
                    wallet_address: string
                    signature_hash: string
                    message_signed: string
                    network: string
                    accepted_at: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    signature_hash: string
                    message_signed: string
                    network?: string
                    accepted_at?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    signature_hash?: string
                    message_signed?: string
                    network?: string
                    accepted_at?: string
                }
            }
        }
    }
}
