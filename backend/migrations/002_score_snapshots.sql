-- Migration 002: store a user's overall risk score over time (R15, DR6).
-- A snapshot is saved only when the overall score is a real number
-- and differs from the user's previous snapshot.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS score_snapshots (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level varchar(20) NOT NULL,
  device_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_score_snapshots_user_created
  ON score_snapshots (user_id, created_at DESC);
