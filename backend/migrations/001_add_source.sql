-- Migration 001: record where each device and software entry came from.
-- manual    = typed in by the user
-- detected  = filled in by the "Detect this computer" button (Sprint 2)
-- extension = sent by the browser extension (later sprint)
-- Safe to run more than once.

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS source varchar(20) NOT NULL DEFAULT 'manual';

ALTER TABLE software
  ADD COLUMN IF NOT EXISTS source varchar(20) NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'devices_source_check') THEN
    ALTER TABLE devices ADD CONSTRAINT devices_source_check
      CHECK (source IN ('manual', 'detected', 'extension'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'software_source_check') THEN
    ALTER TABLE software ADD CONSTRAINT software_source_check
      CHECK (source IN ('manual', 'detected', 'extension'));
  END IF;
END $$;
