CREATE TABLE IF NOT EXISTS subscriber_wallets (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  balance_usd real NOT NULL DEFAULT 10000.0,
  balance_btc real NOT NULL DEFAULT 0.25,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriber_wallets_user_id_idx ON subscriber_wallets(user_id);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id text PRIMARY KEY,
  wallet_id text NOT NULL,
  user_id text NOT NULL,
  type text NOT NULL,
  currency text NOT NULL,
  amount real NOT NULL,
  tx_hash text NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  destination_address text,
  description text,
  created_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_created_at_idx ON wallet_transactions(created_at);
