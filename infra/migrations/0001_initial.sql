-- Migration 0001: initial database foundation
-- Source of truth: docs/data-model.md

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE app_user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published', 'unpublished', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE chapter_status AS ENUM ('draft', 'ready', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'expired', 'cancelled', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE billing_status AS ENUM ('initiated', 'pending', 'paid', 'failed', 'refunded', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE billing_provider AS ENUM ('IAP', 'GOOGLE_PLAY', 'WEB_GATEWAY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE plan_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE source_platform AS ENUM ('ios', 'android', 'web');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  avatar_asset_key text,
  role app_user_role NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx
  ON users (lower(email));

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_refresh_token_hash_uidx
  ON auth_sessions (refresh_token_hash);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
  ON auth_sessions (user_id);

CREATE INDEX IF NOT EXISTS auth_sessions_active_idx
  ON auth_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  avatar_asset_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS narrators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  avatar_asset_key text,
  voice_label text,
  language_code text,
  voice_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_uidx
  ON categories (slug);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_uidx
  ON tags (slug);

CREATE TABLE IF NOT EXISTS audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_asset_key text,
  author_id uuid NOT NULL REFERENCES authors (id) ON DELETE RESTRICT,
  duration_sec integer NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  status content_status NOT NULL DEFAULT 'draft',
  premium_flag boolean NOT NULL DEFAULT false,
  language_code text NOT NULL DEFAULT 'vi',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audiobooks_author_id_idx
  ON audiobooks (author_id);

CREATE INDEX IF NOT EXISTS audiobooks_status_idx
  ON audiobooks (status);

CREATE INDEX IF NOT EXISTS audiobooks_premium_flag_idx
  ON audiobooks (premium_flag);

CREATE INDEX IF NOT EXISTS audiobooks_published_at_idx
  ON audiobooks (published_at DESC);

CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL CHECK (order_index > 0),
  duration_sec integer NOT NULL DEFAULT 0 CHECK (duration_sec >= 0),
  audio_asset_key text NOT NULL,
  transcript text,
  status chapter_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chapters_audiobook_order_uidx
  ON chapters (audiobook_id, order_index);

CREATE INDEX IF NOT EXISTS chapters_audiobook_id_idx
  ON chapters (audiobook_id);

CREATE INDEX IF NOT EXISTS chapters_status_idx
  ON chapters (status);

CREATE TABLE IF NOT EXISTS audiobook_narrators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  narrator_id uuid NOT NULL REFERENCES narrators (id) ON DELETE RESTRICT,
  role_index smallint NOT NULL CHECK (role_index BETWEEN 1 AND 3),
  is_primary boolean NOT NULL DEFAULT false CHECK (is_primary = (role_index = 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS audiobook_narrators_role_uidx
  ON audiobook_narrators (audiobook_id, role_index);

CREATE UNIQUE INDEX IF NOT EXISTS audiobook_narrators_audiobook_narrator_uidx
  ON audiobook_narrators (audiobook_id, narrator_id);

CREATE UNIQUE INDEX IF NOT EXISTS audiobook_narrators_primary_uidx
  ON audiobook_narrators (audiobook_id)
  WHERE is_primary;

CREATE INDEX IF NOT EXISTS audiobook_narrators_audiobook_id_idx
  ON audiobook_narrators (audiobook_id);

CREATE INDEX IF NOT EXISTS audiobook_narrators_narrator_id_idx
  ON audiobook_narrators (narrator_id);

CREATE TABLE IF NOT EXISTS audiobook_categories (
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (audiobook_id, category_id)
);

CREATE INDEX IF NOT EXISTS audiobook_categories_category_id_idx
  ON audiobook_categories (category_id);

CREATE TABLE IF NOT EXISTS audiobook_tags (
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (audiobook_id, tag_id)
);

CREATE INDEX IF NOT EXISTS audiobook_tags_tag_id_idx
  ON audiobook_tags (tag_id);

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  position_ms integer NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  completed boolean NOT NULL DEFAULT false,
  last_played_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_progress_user_audiobook_uidx
  ON user_progress (user_id, audiobook_id);

CREATE INDEX IF NOT EXISTS user_progress_user_id_idx
  ON user_progress (user_id);

CREATE INDEX IF NOT EXISTS user_progress_audiobook_id_idx
  ON user_progress (audiobook_id);

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  position_ms integer NOT NULL CHECK (position_ms >= 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx
  ON bookmarks (user_id);

CREATE INDEX IF NOT EXISTS bookmarks_audiobook_id_idx
  ON bookmarks (audiobook_id);

CREATE INDEX IF NOT EXISTS bookmarks_user_audiobook_idx
  ON bookmarks (user_id, audiobook_id);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_audiobook_uidx
  ON favorites (user_id, audiobook_id);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx
  ON favorites (user_id);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  audiobook_id uuid NOT NULL REFERENCES audiobooks (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  position_ms integer NOT NULL CHECK (position_ms >= 0),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_id_idx
  ON notes (user_id);

CREATE INDEX IF NOT EXISTS notes_audiobook_id_idx
  ON notes (audiobook_id);

CREATE INDEX IF NOT EXISTS notes_user_audiobook_idx
  ON notes (user_id, audiobook_id);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  status plan_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_plans_status_idx
  ON subscription_plans (status);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans (id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'pending',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  provider text,
  provider_subscription_id text,
  billing_provider billing_provider NOT NULL,
  billing_status billing_status NOT NULL DEFAULT 'initiated',
  billing_reference text,
  checkout_session_id text,
  last_billing_at timestamptz,
  next_billing_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at >= start_at)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON subscriptions (user_id);

CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx
  ON subscriptions (plan_id);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx
  ON subscriptions (status);

CREATE INDEX IF NOT EXISTS subscriptions_billing_provider_idx
  ON subscriptions (billing_provider);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_active_user_uidx
  ON subscriptions (user_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_billing_reference_uidx
  ON subscriptions (billing_reference);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_checkout_session_id_uidx
  ON subscriptions (checkout_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_provider_subscription_id_uidx
  ON subscriptions (provider_subscription_id);

CREATE TABLE IF NOT EXISTS subscription_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider billing_provider NOT NULL,
  event_type text NOT NULL,
  billing_reference text NOT NULL,
  idempotency_key text NOT NULL,
  subscription_id uuid REFERENCES subscriptions (id) ON DELETE SET NULL,
  checkout_session_id text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_webhook_events_idempotency_uidx
  ON subscription_webhook_events (idempotency_key);

CREATE INDEX IF NOT EXISTS subscription_webhook_events_billing_reference_idx
  ON subscription_webhook_events (billing_reference);

CREATE INDEX IF NOT EXISTS subscription_webhook_events_subscription_id_idx
  ON subscription_webhook_events (subscription_id);

CREATE TABLE IF NOT EXISTS subscription_receipt_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider billing_provider NOT NULL,
  idempotency_key text NOT NULL,
  checkout_session_id text,
  receipt_token text,
  transaction_id text,
  order_id text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_receipt_verifications_idempotency_uidx
  ON subscription_receipt_verifications (idempotency_key);

CREATE INDEX IF NOT EXISTS subscription_receipt_verifications_user_id_idx
  ON subscription_receipt_verifications (user_id);

CREATE INDEX IF NOT EXISTS subscription_receipt_verifications_checkout_session_id_idx
  ON subscription_receipt_verifications (checkout_session_id);

CREATE INDEX IF NOT EXISTS subscription_receipt_verifications_receipt_token_idx
  ON subscription_receipt_verifications (receipt_token);

CREATE INDEX IF NOT EXISTS subscription_receipt_verifications_transaction_id_idx
  ON subscription_receipt_verifications (transaction_id);

CREATE INDEX IF NOT EXISTS subscription_receipt_verifications_order_id_idx
  ON subscription_receipt_verifications (order_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  event_name text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_platform source_platform NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx
  ON analytics_events (user_id);

CREATE INDEX IF NOT EXISTS analytics_events_event_name_idx
  ON analytics_events (event_name);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON analytics_events (created_at DESC);

COMMIT;
