-- Table pour stocker les subscriptions Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  role text NOT NULL DEFAULT 'manager',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS désactivé pour permettre les upserts depuis l'API (server-side)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Index pour filtrer par rôle rapidement
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role ON push_subscriptions(role);
