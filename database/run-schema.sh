#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  Run the full HRMS schema against Neon PostgreSQL
#  Prereq: psql installed  (brew install postgresql)
# ─────────────────────────────────────────────────────────
set -e

DB_URL="postgresql://neondb_owner:npg_GbCE3xsd5Teq@ep-little-cake-ahfjtrj2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "🚀 Running Yahweh HRMS schema migration..."
psql "$DB_URL" -f "$(dirname "$0")/migrations/001_initial_schema.sql"
echo "✅ Schema applied successfully."
