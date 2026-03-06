CREATE TABLE public.user_signatures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  signature_hash text NOT NULL,
  message_signed text NOT NULL,
  network text NOT NULL DEFAULT 'sui:testnet',
  accepted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;

-- Crear política para insertar
CREATE POLICY "Permitir inserciones a cualquier usuario" 
ON public.user_signatures FOR INSERT 
TO public
WITH CHECK (true);

-- Crear política para leer
CREATE POLICY "Permitir lecturas a cualquier usuario" 
ON public.user_signatures FOR SELECT 
TO public
USING (true);

-- Crear índice para consultas rápidas por wallet
CREATE INDEX idx_user_signatures_wallet ON public.user_signatures(wallet_address);
