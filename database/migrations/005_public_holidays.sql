-- ── Public Holidays ───────────────────────────────────────────────────────────
-- Migration 005: public_holidays table

CREATE TABLE public_holidays (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  date        DATE        NOT NULL,
  country     VARCHAR(10) NOT NULL DEFAULT 'AU',
  state       VARCHAR(10),          -- NULL = national
  is_national BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ph_unique UNIQUE (tenant_id, date, name)
);

CREATE INDEX ph_tenant_idx ON public_holidays (tenant_id);
CREATE INDEX ph_date_idx   ON public_holidays (date);
