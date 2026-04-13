-- PostgreSQL Schema for Lively Platform

-- 1. Models Table (Persists model accounts)
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    pseudo VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    dob DATE,
    phone VARCHAR(50),
    country VARCHAR(100),
    photo_profile TEXT,
    photo_id TEXT,
    photo_id_selfie TEXT,
    lang VARCHAR(10) DEFAULT 'en',
    status VARCHAR(20) DEFAULT 'active', -- active, disabled, pending, banned
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_gains DECIMAL(15, 2) DEFAULT 0.00,
    total_payouts DECIMAL(15, 2) DEFAULT 0.00,
    marketing_src VARCHAR(255),
    marketing_camp VARCHAR(255),
    marketing_ad VARCHAR(255),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    billing_info JSONB DEFAULT '{}'
);

-- 2. Users Table (Persists client accounts)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    pseudo VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- active, disabled, banned
    credits DECIMAL(15, 2) DEFAULT 0.00,
    total_spent DECIMAL(15, 2) DEFAULT 0.00,
    marketing_src VARCHAR(255),
    marketing_camp VARCHAR(255),
    marketing_ad VARCHAR(255),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. Invoices/Payouts History
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_email VARCHAR(255) REFERENCES models(email) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, rejected
    invoice_number VARCHAR(100),
    invoice_file TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Global Settings (Shared with Redis for fast access, but SQL is source of truth)
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for scalability
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_models_email ON models(email);
CREATE INDEX IF NOT EXISTS idx_users_registered_at ON users(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_registered_at ON models(registered_at DESC);
