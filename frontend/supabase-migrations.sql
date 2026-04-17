-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id               BIGINT UNIQUE NOT NULL,
  username                  TEXT,
  first_name                TEXT,
  trial_started_at          TIMESTAMPTZ,
  terms_accepted_at         TIMESTAMPTZ,
  subscription_activated_at TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Только service_role может читать/писать
DROP POLICY IF EXISTS "service_role_only" ON users;
CREATE POLICY "service_role_only" ON users
  USING (auth.role() = 'service_role');

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    TEXT UNIQUE NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON payments;
CREATE POLICY "service_role_only" ON payments
  USING (auth.role() = 'service_role');

-- Таблица данных дневника
CREATE TABLE IF NOT EXISTS diary_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE diary_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON diary_data;
CREATE POLICY "service_role_only" ON diary_data
  USING (auth.role() = 'service_role');

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER diary_data_updated_at
  BEFORE UPDATE ON diary_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
