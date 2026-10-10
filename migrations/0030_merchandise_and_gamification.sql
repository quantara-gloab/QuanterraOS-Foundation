-- Migration 0030: Merchandise Storefront, Raffles, Point System & Calibration Tournaments
CREATE TABLE IF NOT EXISTS merchandise_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'hoodie' | 'jumpsuit' | 'suit_mens' | 'suit_womens'
  mascot TEXT NOT NULL, -- 'quanta' | 'destroyer' | 'terminator' | 'council'
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  points_cost INTEGER NOT NULL,
  materials TEXT NOT NULL,
  image_url TEXT NOT NULL,
  available_sizes_json TEXT NOT NULL,
  badge TEXT,
  in_stock INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS merch_products_category_idx ON merchandise_products(category);
CREATE INDEX IF NOT EXISTS merch_products_mascot_idx ON merchandise_products(mascot);

CREATE TABLE IF NOT EXISTS merchandise_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  size TEXT NOT NULL,
  gender_cut TEXT NOT NULL DEFAULT 'unisex', -- 'mens' | 'womens' | 'unisex'
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cents INTEGER NOT NULL,
  points_spent INTEGER NOT NULL DEFAULT 0,
  shipping_address_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'tailoring' | 'shipped'
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS merch_orders_user_id_idx ON merchandise_orders(user_id);
CREATE INDEX IF NOT EXISTS merch_orders_created_at_idx ON merchandise_orders(created_at);

CREATE TABLE IF NOT EXISTS raffle_drawings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  prize_name TEXT NOT NULL,
  prize_description TEXT NOT NULL,
  prize_category TEXT NOT NULL,
  ticket_points_cost INTEGER NOT NULL DEFAULT 100,
  ends_at TEXT NOT NULL,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'drawn'
  winner_callsign TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raffle_tickets (
  id TEXT PRIMARY KEY,
  raffle_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'daily_check_reward',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS raffle_tickets_user_id_idx ON raffle_tickets(user_id);
CREATE INDEX IF NOT EXISTS raffle_tickets_raffle_id_idx ON raffle_tickets(raffle_id);

CREATE TABLE IF NOT EXISTS discipline_tournaments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  season TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_merchandise TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'completed'
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_leaderboard (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  callsign TEXT NOT NULL,
  brier_score REAL NOT NULL,
  calibration_accuracy REAL NOT NULL,
  rank INTEGER NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'eligible',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS tournament_leaderboard_tournament_idx ON tournament_leaderboard(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_leaderboard_rank_idx ON tournament_leaderboard(rank);
