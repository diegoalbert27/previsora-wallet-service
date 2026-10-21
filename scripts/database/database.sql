-- ==========================================
-- 1. EXTENSIONES Y TIPOS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE connection_type AS ENUM ('CEX', 'ONCHAIN_WALLET', 'COLD_WALLET');
CREATE TYPE rule_trigger AS ENUM ('ON_NEW_DEPOSIT', 'ON_BALANCE_THRESHOLD');

-- ==========================================
-- 2. TABLAS PRINCIPALES (DDL)
-- ==========================================

-- Perfiles (Extendiendo auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    default_currency VARCHAR(10) DEFAULT 'USD',
    delete_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo Global de Monedas Soportadas
CREATE TABLE public.supported_assets (
    symbol VARCHAR(10) PRIMARY KEY, -- Ej: 'USDC', 'USDT', 'USD1'
    asset_name VARCHAR(50) NOT NULL,      
    asset_type VARCHAR(20) DEFAULT 'STABLECOIN',
    image_url TEXT,                 
    is_active BOOLEAN DEFAULT TRUE,
    delete_status BOOLEAN DEFAULT FALSE
);

-- Monedas Trackeadas por el Usuario
CREATE TABLE public.user_tracked_assets (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(10) REFERENCES public.supported_assets(symbol) ON DELETE CASCADE,
    is_visible BOOLEAN DEFAULT TRUE,
    delete_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, asset_symbol)
);

-- Conexiones (Exchanges y Wallets Multicadena)
CREATE TABLE public.connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    connection_type connection_type NOT NULL,
    provider VARCHAR(50) NOT NULL, -- Ej: 'BINANCE', 'PHANTOM', 'TREZOR'
    network VARCHAR(50),           -- Ej: 'SOLANA', 'ETHEREUM', 'BASE'
    public_address VARCHAR(255),   
    encrypted_api_key TEXT,        
    delete_status BOOLEAN DEFAULT FALSE,
    encrypted_api_secret TEXT,     
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saldos Reales (Sincronizados)
CREATE TABLE public.balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    asset VARCHAR(10) REFERENCES public.supported_assets(symbol) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(18, 8) DEFAULT 0.00000000,
    delete_status BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(connection_id, asset)
);

-- Sobres Lógicos (El sistema de ahorro)
CREATE TABLE public.envelopes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL, 
    target_amount DECIMAL(18, 8), 
    current_amount DECIMAL(18, 8) DEFAULT 0.00000000,
    asset VARCHAR(10) REFERENCES public.supported_assets(symbol) ON DELETE CASCADE NOT NULL,
    delete_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Motor de Reglas
CREATE TABLE public.rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    trigger_event rule_trigger NOT NULL,
    percentage_to_route DECIMAL(5, 2) NOT NULL, 
    target_envelope_id UUID REFERENCES public.envelopes(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(target_envelope_id, trigger_event) -- una regla por sobre y tipo de disparador (permite upsert)
);

-- Historial de Ejecución de Reglas
CREATE TABLE public.execution_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rule_id UUID REFERENCES public.rules(id) ON DELETE SET NULL,
    amount_routed DECIMAL(18, 8) NOT NULL,
    description_log TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. DATOS INICIALES (SEMILLA)
-- ==========================================
INSERT INTO public.supported_assets (symbol, asset_name, asset_type) VALUES 
('USDC', 'USD Coin', 'STABLECOIN'),
('USDT', 'Tether', 'STABLECOIN'),
('USD1', 'USD1', 'STABLECOIN')
ON CONFLICT (symbol) DO NOTHING;

-- ==========================================
-- 4. ÍNDICES DE RENDIMIENTO (B-TREE)
-- ==========================================
CREATE INDEX idx_user_tracked_assets_user_id ON public.user_tracked_assets(user_id);
CREATE INDEX idx_connections_user_id ON public.connections(user_id);
CREATE INDEX idx_balances_user_id ON public.balances(user_id);
CREATE INDEX idx_balances_connection_id ON public.balances(connection_id);
CREATE INDEX idx_envelopes_user_id ON public.envelopes(user_id);
CREATE INDEX idx_rules_user_id ON public.rules(user_id);
CREATE INDEX idx_execution_logs_user_id ON public.execution_logs(user_id);

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tracked_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para el Catálogo Global (solo lectura para usuarios autenticados)
CREATE POLICY "Authenticated users can read supported assets" ON public.supported_assets FOR SELECT TO authenticated USING (true);

-- Políticas Genéricas para el resto de tablas transaccionales (CRUD básico amarrado al user_id)
CREATE POLICY "Users can manage own tracked assets" ON public.user_tracked_assets FOR ALL USING (auth.uid() = user_id);
-- Connections: no UPDATE or DELETE policy on purpose. Deleting goes through the remove-connection Edge Function
-- (so the Alchemy webhook stays in sync) and editing an address directly would desync it as well.
CREATE POLICY "Users can view own connections" ON public.connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own balances" ON public.balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own envelopes" ON public.envelopes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own rules" ON public.rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own logs" ON public.execution_logs FOR SELECT USING (auth.uid() = user_id);
