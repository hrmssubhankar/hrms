-- Migration 006: Add missing password_reset_token and password_reset_expiry columns to users table
-- These columns exist in the Drizzle schema but were not included in 001_initial_schema.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset_token  TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMPTZ;
