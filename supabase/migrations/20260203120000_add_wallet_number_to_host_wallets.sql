-- Add wallet fields needed for EVC payments (safe for existing data)
ALTER TABLE host_wallets
  ADD COLUMN IF NOT EXISTS wallet_number text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Optional: ensure a host has only one wallet row
ALTER TABLE host_wallets
  ADD CONSTRAINT IF NOT EXISTS host_wallets_host_id_unique UNIQUE (host_id);
