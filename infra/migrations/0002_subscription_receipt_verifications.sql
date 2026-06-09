-- Migration 0002: add receipt verification audit table for subscription verify flow.

BEGIN;

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

COMMIT;
