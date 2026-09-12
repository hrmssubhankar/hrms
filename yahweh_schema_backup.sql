--
-- PostgreSQL database dump
--

\restrict 2GAlprCMhoyDJ4AweJGkqz3j60IIPe3B6JHLWGgshqyY2ufbnnQAVTczyxF6Rad

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA audit;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: catalog; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA catalog;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: hangfire; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA hangfire;


--
-- Name: iam; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA iam;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: tenant; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tenant;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: announcement_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.announcement_priority AS ENUM (
    'info',
    'warning',
    'critical'
);


--
-- Name: compliance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.compliance_status AS ENUM (
    'green',
    'amber',
    'red',
    'pending'
);


--
-- Name: document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_status AS ENUM (
    'active',
    'expired',
    'archived',
    'pending_review'
);


--
-- Name: employment_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employment_type AS ENUM (
    'full_time',
    'part_time',
    'casual',
    'contractor',
    'volunteer'
);


--
-- Name: leave_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: leave_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_type AS ENUM (
    'annual',
    'sick',
    'personal',
    'unpaid',
    'long_service',
    'carer',
    'compassionate'
);


--
-- Name: tenant_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tenant_tier AS ENUM (
    'starter',
    'professional',
    'enterprise'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'director',
    'hr_officer',
    'compliance_manager',
    'operations_manager',
    'team_leader',
    'payroll_officer',
    'employee',
    'contractor',
    'auditor',
    'it_admin'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
             ORDER BY %I %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_sort_order text;
    v_sort_column text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: hrms_super_admin_events; Type: TABLE; Schema: audit; Owner: -
--

CREATE TABLE audit.hrms_super_admin_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    super_admin_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value text,
    new_value text,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: super_admin_events; Type: TABLE; Schema: audit; Owner: -
--

CREATE TABLE audit.super_admin_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    super_admin_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: hrms_modules; Type: TABLE; Schema: catalog; Owner: -
--

CREATE TABLE catalog.hrms_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_key text NOT NULL,
    display_name text NOT NULL,
    description text,
    icon_name text,
    category text DEFAULT 'core'::text NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    display_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_plan_default_modules; Type: TABLE; Schema: catalog; Owner: -
--

CREATE TABLE catalog.hrms_plan_default_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan text NOT NULL,
    module_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: catalog; Owner: -
--

CREATE TABLE catalog.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_key text NOT NULL,
    display_name text NOT NULL,
    description text,
    icon_name text,
    category text DEFAULT 'core'::text NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    display_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT modules_category_check CHECK ((category = ANY (ARRAY['core'::text, 'talent'::text, 'operations'::text, 'experience'::text, 'compliance'::text, 'analytics'::text])))
);


--
-- Name: plan_default_modules; Type: TABLE; Schema: catalog; Owner: -
--

CREATE TABLE catalog.plan_default_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan text NOT NULL,
    module_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT plan_default_modules_plan_check CHECK ((plan = ANY (ARRAY['starter'::text, 'professional'::text, 'enterprise'::text])))
);


--
-- Name: aggregatedcounter; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.aggregatedcounter (
    id bigint NOT NULL,
    key text NOT NULL,
    value bigint NOT NULL,
    expireat timestamp with time zone
);


--
-- Name: aggregatedcounter_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.aggregatedcounter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aggregatedcounter_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.aggregatedcounter_id_seq OWNED BY hangfire.aggregatedcounter.id;


--
-- Name: counter; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.counter (
    id bigint NOT NULL,
    key text NOT NULL,
    value bigint NOT NULL,
    expireat timestamp with time zone
);


--
-- Name: counter_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.counter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: counter_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.counter_id_seq OWNED BY hangfire.counter.id;


--
-- Name: hash; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.hash (
    id bigint NOT NULL,
    key text NOT NULL,
    field text NOT NULL,
    value text,
    expireat timestamp with time zone,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: hash_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.hash_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hash_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.hash_id_seq OWNED BY hangfire.hash.id;


--
-- Name: job; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.job (
    id bigint NOT NULL,
    stateid bigint,
    statename text,
    invocationdata jsonb NOT NULL,
    arguments jsonb NOT NULL,
    createdat timestamp with time zone NOT NULL,
    expireat timestamp with time zone,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: job_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.job_id_seq OWNED BY hangfire.job.id;


--
-- Name: jobparameter; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.jobparameter (
    id bigint NOT NULL,
    jobid bigint NOT NULL,
    name text NOT NULL,
    value text,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: jobparameter_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.jobparameter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobparameter_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.jobparameter_id_seq OWNED BY hangfire.jobparameter.id;


--
-- Name: jobqueue; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.jobqueue (
    id bigint NOT NULL,
    jobid bigint NOT NULL,
    queue text NOT NULL,
    fetchedat timestamp with time zone,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: jobqueue_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.jobqueue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobqueue_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.jobqueue_id_seq OWNED BY hangfire.jobqueue.id;


--
-- Name: list; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.list (
    id bigint NOT NULL,
    key text NOT NULL,
    value text,
    expireat timestamp with time zone,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: list_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.list_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: list_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.list_id_seq OWNED BY hangfire.list.id;


--
-- Name: lock; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.lock (
    resource text NOT NULL,
    updatecount integer DEFAULT 0 NOT NULL,
    acquired timestamp with time zone
);


--
-- Name: schema; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.schema (
    version integer NOT NULL
);


--
-- Name: server; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.server (
    id text NOT NULL,
    data jsonb,
    lastheartbeat timestamp with time zone NOT NULL,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: set; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.set (
    id bigint NOT NULL,
    key text NOT NULL,
    score double precision NOT NULL,
    value text NOT NULL,
    expireat timestamp with time zone,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: set_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.set_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: set_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.set_id_seq OWNED BY hangfire.set.id;


--
-- Name: state; Type: TABLE; Schema: hangfire; Owner: -
--

CREATE TABLE hangfire.state (
    id bigint NOT NULL,
    jobid bigint NOT NULL,
    name text NOT NULL,
    reason text,
    createdat timestamp with time zone NOT NULL,
    data jsonb,
    updatecount integer DEFAULT 0 NOT NULL
);


--
-- Name: state_id_seq; Type: SEQUENCE; Schema: hangfire; Owner: -
--

CREATE SEQUENCE hangfire.state_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: state_id_seq; Type: SEQUENCE OWNED BY; Schema: hangfire; Owner: -
--

ALTER SEQUENCE hangfire.state_id_seq OWNED BY hangfire.state.id;


--
-- Name: hrms_super_admin_users; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.hrms_super_admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    display_name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    mfa_enabled boolean DEFAULT false NOT NULL,
    totp_secret text,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: super_admin_users; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.super_admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    display_name text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    mfa_enabled boolean DEFAULT false NOT NULL,
    totp_secret text,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: iam; Owner: -
--

CREATE TABLE iam.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subdomain text NOT NULL,
    logo_url text,
    plan text DEFAULT 'starter'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    contact_email text,
    contact_phone text,
    country_code text DEFAULT 'AU'::text NOT NULL,
    timezone text DEFAULT 'Australia/Sydney'::text NOT NULL,
    max_employees integer DEFAULT 50 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT tenants_plan_check CHECK ((plan = ANY (ARRAY['starter'::text, 'professional'::text, 'enterprise'::text])))
);


--
-- Name: hrms_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    job_requisition_id uuid NOT NULL,
    status character varying(50) DEFAULT 'received'::character varying NOT NULL,
    notes text,
    interview_date date,
    offered_salary numeric(15,2),
    offer_expiry date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    requisition_id uuid NOT NULL,
    interview_score numeric(5,2)
);


--
-- Name: hrms_asset_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_asset_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    assigned_on date DEFAULT CURRENT_DATE NOT NULL,
    returned_on date,
    notes text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    issued_at timestamp without time zone DEFAULT now() NOT NULL,
    issued_by uuid,
    returned_at timestamp without time zone,
    returned_to uuid,
    condition character varying(50)
);


--
-- Name: hrms_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    asset_number text NOT NULL,
    category character varying(100) NOT NULL,
    serial_number character varying(100),
    status character varying(50) DEFAULT 'available'::character varying NOT NULL,
    purchase_price numeric(15,2),
    purchase_date date,
    warranty_expiry date,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity text NOT NULL,
    entity_id text,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    resource character varying(100) NOT NULL,
    resource_id uuid,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    resume_url text,
    source character varying(100),
    referred_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_competencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_competencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_competency_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_competency_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    competency_id uuid NOT NULL,
    level smallint DEFAULT 1 NOT NULL,
    notes text,
    assessed_by uuid,
    assessed_on date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assessor_id uuid,
    outcome character varying(50),
    assessed_at timestamp without time zone,
    expiry_date date,
    evidence text
);


--
-- Name: hrms_compliance_lock_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_compliance_lock_exceptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    reason text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    approved_by uuid NOT NULL,
    approved_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: hrms_compliance_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_compliance_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    requirement text NOT NULL,
    category text NOT NULL,
    status public.compliance_status DEFAULT 'green'::public.compliance_status NOT NULL,
    due_date date,
    completed_on date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    item_type character varying(100) NOT NULL,
    last_checked_at timestamp without time zone,
    escalated_at timestamp without time zone,
    escalated_to uuid
);


--
-- Name: hrms_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    salary numeric(15,2) NOT NULL,
    pay_frequency text DEFAULT 'monthly'::text NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    document_url text,
    is_signed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    pdf_url text,
    signed_pdf_url text,
    sent_at timestamp without time zone,
    signed_at timestamp without time zone,
    signature_ip character varying(45),
    signature_data text,
    tfn_provided boolean DEFAULT false NOT NULL,
    super_fund character varying(200),
    bank_bsb character varying(10),
    bank_account character varying(20)
);


--
-- Name: hrms_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(300) NOT NULL,
    description text,
    category character varying(100),
    provider text,
    duration_mins integer,
    is_mandatory boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    content_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    validity_months integer,
    content jsonb DEFAULT '[]'::jsonb
);


--
-- Name: hrms_crm_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_crm_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    industry character varying(100),
    website character varying(500),
    phone character varying(50),
    email character varying(255),
    address text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    abn character varying(20),
    revenue numeric(15,2),
    employees integer,
    type character varying(50) DEFAULT 'prospect'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    assigned_to character varying(255),
    notes text,
    tags jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_crm_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_crm_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    subject character varying(255) NOT NULL,
    notes text,
    due_date timestamp without time zone,
    completed_at timestamp without time zone,
    is_done boolean DEFAULT false,
    related_type character varying(50),
    related_id uuid,
    assigned_to character varying(255),
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_crm_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    account_id uuid,
    first_name character varying(255) NOT NULL,
    last_name character varying(255),
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    job_title character varying(255),
    department character varying(255),
    is_primary boolean DEFAULT false,
    assigned_to character varying(255),
    notes text,
    tags jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_crm_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_crm_deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    account_id uuid,
    contact_id uuid,
    title character varying(255) NOT NULL,
    value numeric(15,2),
    currency character varying(10) DEFAULT 'AUD'::character varying,
    stage character varying(50) DEFAULT 'prospecting'::character varying NOT NULL,
    probability integer DEFAULT 0,
    close_date date,
    source character varying(100),
    assigned_to character varying(255),
    notes text,
    lost_reason text,
    tags jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_crm_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_crm_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255),
    email character varying(255),
    phone character varying(50),
    company character varying(255),
    job_title character varying(255),
    source character varying(100),
    status character varying(50) DEFAULT 'new'::character varying NOT NULL,
    stage character varying(50) DEFAULT 'new'::character varying NOT NULL,
    score integer DEFAULT 0,
    assigned_to character varying(255),
    notes text,
    tags jsonb DEFAULT '[]'::jsonb,
    custom_fields jsonb DEFAULT '{}'::jsonb,
    converted_at timestamp without time zone,
    converted_to_id uuid,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    code text,
    manager_id uuid,
    parent_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_diversity_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_diversity_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    gender character varying(50),
    indigenous_status boolean,
    disability_status boolean,
    cultural_background character varying(100),
    adjustments_required text,
    self_reported boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid,
    name text NOT NULL,
    category character varying(100) NOT NULL,
    storage_url text NOT NULL,
    content_type text,
    size_bytes bigint DEFAULT 0 NOT NULL,
    expires_on date,
    is_confidential boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    title character varying(300) NOT NULL,
    blob_url text NOT NULL,
    file_name character varying(255),
    file_size_bytes integer,
    mime_type character varying(100),
    status public.document_status DEFAULT 'active'::public.document_status NOT NULL,
    expiry_date date,
    uploaded_by uuid,
    notes text,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: hrms_emergency_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_emergency_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    relationship character varying(100),
    phone character varying(20),
    email character varying(255),
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: hrms_employee_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_employee_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_employee_benefits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_employee_benefits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    description text,
    start_date date,
    end_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_employee_experience; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_employee_experience (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    company_name character varying(255) NOT NULL,
    job_title character varying(255) NOT NULL,
    employment_type character varying(50) DEFAULT 'full_time'::character varying NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_current boolean DEFAULT false NOT NULL,
    location character varying(255),
    description text,
    reason_for_leaving character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_employee_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_employee_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_email character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    employee_number character varying(50) NOT NULL,
    date_of_birth date,
    gender character varying(50),
    status text DEFAULT 'active'::text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    employment_type public.employment_type NOT NULL,
    department_id uuid,
    position_id uuid,
    manager_id uuid,
    avatar_url text,
    address text,
    tax_file_number text,
    bank_account text,
    salary numeric(15,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    preferred_name character varying(100),
    photo_url text,
    entity_name character varying(100),
    award_classification character varying(100),
    pay_level character varying(50),
    hourly_rate numeric(10,4),
    annual_salary numeric(12,2),
    ordinary_hours_per_week numeric(5,2) DEFAULT '38'::numeric,
    probation_end_date date,
    is_active boolean DEFAULT true NOT NULL,
    compliance_status public.compliance_status DEFAULT 'pending'::public.compliance_status NOT NULL,
    ndis_worker boolean DEFAULT false NOT NULL
);


--
-- Name: hrms_ess_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ess_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    priority character varying(50) DEFAULT 'info'::character varying NOT NULL,
    target_role character varying(100),
    published_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_ess_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ess_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    preferred_name character varying(100),
    date_of_birth date,
    gender character varying(50),
    phone character varying(20),
    address text,
    tfn_declared boolean DEFAULT false NOT NULL,
    tax_residency character varying(50),
    tax_free_threshold boolean DEFAULT false NOT NULL,
    has_help_debt boolean DEFAULT false NOT NULL,
    tax_file_number character varying(9),
    super_fund_name character varying(255),
    super_fund_abn character varying(20),
    super_usi character varying(50),
    super_member_number character varying(100),
    is_smsf boolean DEFAULT false NOT NULL,
    bank_name character varying(100),
    bank_bsb character varying(7),
    bank_account_number character varying(20),
    bank_account_name character varying(100),
    emergency_name character varying(200),
    emergency_relation character varying(100),
    emergency_phone character varying(20),
    emergency_phone2 character varying(20),
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    submitted_at timestamp without time zone,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    hr_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_ess_quick_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ess_quick_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    label character varying(255) NOT NULL,
    url character varying(1000) NOT NULL,
    icon character varying(50),
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_expense_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_expense_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency character varying(10) DEFAULT 'AUD'::character varying,
    expense_date date NOT NULL,
    description text,
    receipt_url character varying(1000),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    submitted_at timestamp without time zone DEFAULT now(),
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    review_notes text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_grievances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_grievances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    resolution text,
    assigned_to uuid,
    resolved_on date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    lodged_by uuid,
    subject_id uuid,
    type character varying(100) NOT NULL,
    risk_rating character varying(20),
    outcome text,
    closed_at timestamp without time zone
);


--
-- Name: hrms_headcount_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_headcount_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    department_id uuid,
    position_id uuid,
    planned_count integer NOT NULL,
    current_count integer DEFAULT 0 NOT NULL,
    vacancy_count integer DEFAULT 0 NOT NULL,
    target_date date,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_job_requisitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_job_requisitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    department_id uuid,
    position_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    type text DEFAULT 'full-time'::text NOT NULL,
    headcount integer DEFAULT 1 NOT NULL,
    description text,
    closing_date date,
    hiring_manager uuid,
    budget numeric(15,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    requested_by uuid,
    approved_by uuid,
    approved_at timestamp without time zone,
    closed_at timestamp without time zone
);


--
-- Name: hrms_leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_leave_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL,
    reason text,
    status public.leave_status DEFAULT 'pending'::public.leave_status NOT NULL,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    review_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_ndis_audit_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ndis_audit_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    audit_id uuid NOT NULL,
    description text NOT NULL,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    due_date date,
    resolved_at timestamp without time zone,
    assigned_to character varying(255),
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_ndis_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ndis_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    audit_type character varying(100) NOT NULL,
    standard character varying(255) NOT NULL,
    outcome_group character varying(100),
    status character varying(50) DEFAULT 'scheduled'::character varying NOT NULL,
    result character varying(50),
    risk_rating character varying(50),
    scheduled_date date NOT NULL,
    completed_date date,
    next_review_date date,
    auditor_name character varying(255),
    auditor_org character varying(255),
    finding_summary text,
    corrective_actions text,
    evidence_url character varying(1000),
    notes text,
    assigned_to character varying(255),
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_ndis_incident_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ndis_incident_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    incident_id uuid NOT NULL,
    description text NOT NULL,
    action_type character varying(100) DEFAULT 'corrective'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    due_date date,
    resolved_at timestamp without time zone,
    assigned_to character varying(255),
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_ndis_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_ndis_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    incident_type character varying(100) NOT NULL,
    incident_category character varying(100),
    is_reportable boolean DEFAULT true NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    severity character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    participant_id uuid,
    participant_name character varying(255),
    worker_name character varying(255),
    worker_role character varying(100),
    witness_names text,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    location character varying(500),
    incident_date timestamp without time zone NOT NULL,
    discovered_date timestamp without time zone,
    reported_internally boolean DEFAULT false NOT NULL,
    internal_report_date date,
    commission_notified boolean DEFAULT false NOT NULL,
    commission_notify_date date,
    commission_ref_number character varying(100),
    police_notified boolean DEFAULT false NOT NULL,
    police_report_number character varying(100),
    immediate_actions text,
    root_cause text,
    outcome_description text,
    evidence_url character varying(1000),
    assigned_to character varying(255),
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    type text DEFAULT 'info'::text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    action_url text,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    body text,
    link character varying(500)
);


--
-- Name: hrms_offer_letter_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_offer_letter_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    event character varying(100) NOT NULL,
    note text,
    performed_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_offer_letter_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_offer_letter_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    content text NOT NULL,
    file_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_by text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_offer_letters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_offer_letters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    candidate_name character varying(255) NOT NULL,
    candidate_email character varying(255) NOT NULL,
    "position" character varying(255) NOT NULL,
    department character varying(255),
    employment_type character varying(50) DEFAULT 'full_time'::character varying NOT NULL,
    start_date date,
    salary_amount integer,
    salary_cycle character varying(20) DEFAULT 'annual'::character varying NOT NULL,
    template_content text,
    pdf_url text,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    sent_at timestamp without time zone,
    accepted_at timestamp without time zone,
    rejected_at timestamp without time zone,
    expires_at timestamp without time zone,
    acceptance_token text,
    recruitment_id uuid,
    employee_id uuid,
    created_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_onboarding_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_onboarding_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    stage text DEFAULT 'pre-start'::text NOT NULL,
    status text DEFAULT 'in-progress'::text NOT NULL,
    notes text,
    completed_on date,
    assigned_to uuid,
    checklist text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    buddy_id uuid
);


--
-- Name: hrms_participant_behaviour_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_behaviour_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    plan_name character varying(255) NOT NULL,
    behaviour_type character varying(100),
    triggers text,
    early_warnings text,
    prevention_strategies text,
    de_escalation_strategies text,
    response_strategies text,
    post_incident_support text,
    authorised_by character varying(255),
    review_date date,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    contact_type character varying(50) DEFAULT 'emergency'::character varying NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    relationship character varying(100),
    phone character varying(20),
    email character varying(255),
    address text,
    is_primary boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    goal_category character varying(100) DEFAULT 'daily_living'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'not_started'::character varying NOT NULL,
    target_date date,
    achieved_date date,
    progress_notes text,
    created_by character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_health_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_health_appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    appointment_type character varying(100) DEFAULT 'gp'::character varying NOT NULL,
    provider_name character varying(255),
    provider_org character varying(255),
    appointment_date date NOT NULL,
    appointment_time character varying(10),
    location character varying(255),
    purpose text,
    outcome text,
    follow_up_date date,
    follow_up_notes text,
    status character varying(50) DEFAULT 'scheduled'::character varying NOT NULL,
    requires_transport boolean DEFAULT false NOT NULL,
    support_worker_needed boolean DEFAULT false NOT NULL,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_health_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_health_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    condition_name character varying(255) NOT NULL,
    condition_type character varying(100) DEFAULT 'chronic'::character varying NOT NULL,
    icd_code character varying(20),
    severity character varying(50) DEFAULT 'moderate'::character varying NOT NULL,
    diagnosed_date date,
    diagnosed_by character varying(255),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    description text,
    management_plan text,
    alerts text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    incident_date date NOT NULL,
    incident_time character varying(10),
    location character varying(255),
    incident_type character varying(100) DEFAULT 'general'::character varying NOT NULL,
    severity character varying(50) DEFAULT 'minor'::character varying NOT NULL,
    description text NOT NULL,
    immediate_action text,
    witnesses text,
    reported_by character varying(255),
    reported_to character varying(255),
    ndis_reportable boolean DEFAULT false NOT NULL,
    police_report boolean DEFAULT false NOT NULL,
    police_report_number character varying(100),
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    outcome text,
    follow_up_required boolean DEFAULT false NOT NULL,
    follow_up_date date,
    follow_up_notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_medication_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_medication_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    medication_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    scheduled_time timestamp without time zone NOT NULL,
    administered_at timestamp without time zone,
    outcome character varying(50) DEFAULT 'given'::character varying NOT NULL,
    administered_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_medications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_medications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    medication_name character varying(255) NOT NULL,
    generic_name character varying(255),
    dosage character varying(100),
    form character varying(50) DEFAULT 'tablet'::character varying NOT NULL,
    route character varying(50) DEFAULT 'oral'::character varying NOT NULL,
    frequency character varying(100),
    prescribed_by character varying(255),
    indication text,
    instructions text,
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    requires_assist boolean DEFAULT true NOT NULL,
    refrigerated boolean DEFAULT false NOT NULL,
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    note_type character varying(50) DEFAULT 'case_note'::character varying NOT NULL,
    title character varying(255),
    content text NOT NULL,
    visibility character varying(50) DEFAULT 'internal'::character varying NOT NULL,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_restrictive_practices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_restrictive_practices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    practice_type character varying(100) NOT NULL,
    description text NOT NULL,
    authorised_by character varying(255),
    authorised_date date,
    expiry_date date,
    regulatory_approval boolean DEFAULT false NOT NULL,
    approval_reference character varying(255),
    monitoring_frequency character varying(100),
    last_review_date date,
    next_review_date date,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participant_support_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participant_support_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    plan_type character varying(50) DEFAULT 'initial'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    plan_start_date date,
    plan_end_date date,
    review_date date,
    total_budget numeric(12,2),
    funded_supports text,
    coordinator_name character varying(255),
    coordinator_org character varying(255),
    coordinator_email character varying(255),
    notes text,
    created_by character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    preferred_name character varying(100),
    ndis_number character varying(20),
    date_of_birth date,
    address text,
    phone character varying(20),
    email character varying(255),
    support_level character varying(100),
    funding_body character varying(100) DEFAULT 'NDIS'::character varying,
    plan_start_date date,
    plan_end_date date,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_payroll_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_payroll_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    period text NOT NULL,
    gross_pay numeric(15,2) NOT NULL,
    tax numeric(15,2) NOT NULL,
    superannuation numeric(15,2) NOT NULL,
    deductions numeric(15,2) NOT NULL,
    net_pay numeric(15,2) NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    paid_on date,
    reference text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    hours_worked numeric(8,2),
    hourly_rate numeric(10,4),
    payg_withholding numeric(10,2),
    medicare_levy numeric(10,2),
    super_contribution numeric(10,2),
    payslip_data jsonb DEFAULT '{}'::jsonb,
    exported_to_xero boolean DEFAULT false NOT NULL,
    exported_at timestamp without time zone
);


--
-- Name: hrms_payroll_run_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_payroll_run_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    run_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    employee_number character varying(50),
    first_name character varying(100),
    last_name character varying(100),
    employment_type character varying(50),
    hours_worked numeric(8,2) DEFAULT 0,
    hourly_rate numeric(10,4) DEFAULT 0,
    ordinary_pay numeric(10,2) DEFAULT 0,
    overtime_pay numeric(10,2) DEFAULT 0,
    allowances numeric(10,2) DEFAULT 0,
    gross_pay numeric(10,2) DEFAULT 0,
    payg_withholding numeric(10,2) DEFAULT 0,
    medicare_levy numeric(10,2) DEFAULT 0,
    other_deductions numeric(10,2) DEFAULT 0,
    super_contribution numeric(10,2) DEFAULT 0,
    net_pay numeric(10,2) DEFAULT 0,
    leave_accrued numeric(8,4) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_payroll_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_payroll_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    pay_date date,
    frequency character varying(50) DEFAULT 'fortnightly'::character varying NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    total_gross numeric(12,2) DEFAULT 0,
    total_net numeric(12,2) DEFAULT 0,
    total_tax numeric(12,2) DEFAULT 0,
    total_super numeric(12,2) DEFAULT 0,
    employee_count integer DEFAULT 0,
    notes text,
    created_by character varying(255),
    finalised_by character varying(255),
    finalised_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_performance_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_performance_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    review_id uuid,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    target_date date,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    self_rating integer,
    manager_rating integer,
    manager_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_performance_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    period text NOT NULL,
    type text DEFAULT 'annual'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    overall_score smallint,
    goals text,
    achievements text,
    manager_notes text,
    employee_notes text,
    due_date date,
    completed_on date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_date date,
    completed_at timestamp without time zone,
    overall_rating numeric(3,1),
    employee_input jsonb,
    manager_input jsonb,
    kpis jsonb DEFAULT '[]'::jsonb,
    development_plan text,
    outcome character varying(100)
);


--
-- Name: hrms_platform_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_platform_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(300) NOT NULL,
    body text NOT NULL,
    priority public.announcement_priority DEFAULT 'info'::public.announcement_priority NOT NULL,
    target_tenants text DEFAULT 'all'::text NOT NULL,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_positions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    code text,
    department_id uuid,
    min_salary numeric(15,2),
    max_salary numeric(15,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_participant_facing boolean DEFAULT false NOT NULL,
    is_risk_assessed boolean DEFAULT false NOT NULL,
    is_key_personnel boolean DEFAULT false NOT NULL,
    is_whs_sensitive boolean DEFAULT false NOT NULL
);


--
-- Name: hrms_promotion_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_promotion_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    promotion_id uuid NOT NULL,
    event character varying(100) NOT NULL,
    note text,
    performed_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_promotion_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_promotion_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    raised_by_id character varying(255),
    raised_by_name character varying(255),
    current_title character varying(255),
    current_salary integer,
    proposed_title character varying(255) NOT NULL,
    proposed_salary integer,
    effective_date date,
    justification text NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    review_notes text,
    implemented_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_public_holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_public_holidays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    date date NOT NULL,
    country character varying(10) DEFAULT 'AU'::character varying NOT NULL,
    state character varying(10),
    is_national boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_recognitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_recognitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    given_by uuid NOT NULL,
    recipient_id uuid NOT NULL,
    category text DEFAULT 'shout-out'::text NOT NULL,
    message text NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    points integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nominated_by uuid,
    type character varying(100) NOT NULL,
    reason text,
    certificate_url text,
    period character varying(50)
);


--
-- Name: hrms_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    referrer_id uuid NOT NULL,
    candidate_id uuid,
    candidate_name text NOT NULL,
    candidate_email text NOT NULL,
    job_title text,
    status text DEFAULT 'submitted'::text NOT NULL,
    bonus_amount numeric(15,2),
    bonus_paid boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    referred_employee_id uuid,
    referred_name character varying(200),
    referred_email character varying(255),
    bonus_paid_at timestamp without time zone,
    notes text
);


--
-- Name: hrms_roster_template_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_roster_template_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    shift_type character varying(100) DEFAULT 'standard'::character varying NOT NULL,
    location character varying(255),
    participant_id uuid,
    required_staff integer DEFAULT 1 NOT NULL,
    notes text
);


--
-- Name: hrms_roster_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_roster_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_salary_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_salary_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    review_type character varying(50) DEFAULT 'annual'::character varying NOT NULL,
    review_date date NOT NULL,
    effective_date date,
    current_salary numeric(12,2) DEFAULT 0 NOT NULL,
    current_basis character varying(20) DEFAULT 'annual'::character varying NOT NULL,
    proposed_salary numeric(12,2),
    proposed_basis character varying(20),
    increment_amount numeric(12,2),
    increment_percent numeric(5,2),
    justification text,
    performance_rating character varying(50),
    market_data text,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    submitted_by character varying(255),
    submitted_at timestamp without time zone,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    rejection_reason text,
    hr_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_saved_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_saved_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    report_type character varying(100) NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb,
    columns jsonb DEFAULT '[]'::jsonb,
    sort_by character varying(100),
    sort_dir character varying(10) DEFAULT 'asc'::character varying,
    is_shared boolean DEFAULT false NOT NULL,
    created_by character varying(255),
    last_run_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_screening_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_screening_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    completed_on date,
    expires_on date,
    notes text,
    document_url text,
    verified_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    check_type character varying(100) NOT NULL,
    reference_number character varying(100),
    issued_date date,
    expiry_date date,
    document_id uuid,
    verified_at timestamp without time zone
);


--
-- Name: hrms_separation_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_separation_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    separation_id uuid NOT NULL,
    event character varying(100) NOT NULL,
    note text,
    performed_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_separation_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_separation_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    type text DEFAULT 'resignation'::text NOT NULL,
    effective_date date NOT NULL,
    reason text,
    status text DEFAULT 'in-progress'::text NOT NULL,
    exit_interview_done boolean DEFAULT false NOT NULL,
    exit_notes text,
    final_pay numeric(15,2),
    equipment_returned boolean DEFAULT false NOT NULL,
    processed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notice_date date,
    last_working_day date,
    exit_interview_at timestamp without time zone,
    exit_interview_notes text,
    checklist_complete boolean DEFAULT false NOT NULL,
    assets_returned boolean DEFAULT false NOT NULL,
    system_access_revoked boolean DEFAULT false NOT NULL
);


--
-- Name: hrms_shift_swap_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_shift_swap_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    shift_id uuid NOT NULL,
    requested_by_id uuid NOT NULL,
    swap_with_id uuid,
    reason text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by character varying(255),
    reviewed_at timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    department_id uuid,
    day_of_week smallint,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    employee_id uuid NOT NULL,
    participant_id uuid,
    shift_type character varying(100) DEFAULT 'standard'::character varying,
    location character varying(200),
    client_site character varying(200),
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp without time zone,
    compliance_passed boolean DEFAULT false NOT NULL,
    notes text
);


--
-- Name: hrms_super_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_super_admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_super_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_super_contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    super_fund_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    due_date date NOT NULL,
    paid_date date,
    gross_earnings numeric(12,2) DEFAULT 0 NOT NULL,
    sg_rate numeric(5,4) DEFAULT 0.115 NOT NULL,
    sg_amount numeric(12,2) DEFAULT 0 NOT NULL,
    voluntary_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_contribution numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    payment_reference character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_super_funds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_super_funds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    fund_name character varying(255) NOT NULL,
    fund_abn character varying(20),
    usi character varying(50),
    member_number character varying(100),
    is_smsf boolean DEFAULT false NOT NULL,
    smsf_bank_bsb character varying(7),
    smsf_bank_account character varying(20),
    smsf_esa character varying(255),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    is_primary boolean DEFAULT true NOT NULL,
    effective_from date,
    effective_to date,
    source character varying(50) DEFAULT 'employee'::character varying NOT NULL,
    verified_at timestamp without time zone,
    verified_by character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_supervision_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_supervision_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    supervisor_id uuid NOT NULL,
    session_date date NOT NULL,
    notes text,
    action_items text,
    is_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_date date NOT NULL,
    conducted_at timestamp without time zone,
    type character varying(50),
    status character varying(50) DEFAULT 'scheduled'::character varying NOT NULL
);


--
-- Name: hrms_survey_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    survey_id uuid NOT NULL,
    employee_id uuid,
    answers jsonb NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_surveys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'engagement'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_anonymous boolean DEFAULT true NOT NULL,
    questions text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: hrms_tenant_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_tenant_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    module_id integer NOT NULL,
    module_name character varying(100) NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: hrms_tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    subdomain text,
    logo_url text,
    plan text DEFAULT 'starter'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    slug character varying(100) NOT NULL,
    tier public.tenant_tier DEFAULT 'starter'::public.tenant_tier NOT NULL,
    primary_color character varying(7),
    settings jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_timesheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_timesheets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    shift_id uuid,
    work_date date NOT NULL,
    clock_in time without time zone,
    clock_out time without time zone,
    hours_worked numeric(5,2),
    overtime_hours numeric(5,2),
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    break_minutes integer DEFAULT 0 NOT NULL,
    approved_at timestamp without time zone,
    rejected_reason text
);


--
-- Name: hrms_toil_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_toil_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    balance_hours numeric(8,2) DEFAULT 0 NOT NULL,
    total_accrued numeric(8,2) DEFAULT 0 NOT NULL,
    total_taken numeric(8,2) DEFAULT 0 NOT NULL,
    expiry_date date,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_toil_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_toil_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    entry_type character varying(20) DEFAULT 'accrual'::character varying NOT NULL,
    work_date date NOT NULL,
    hours numeric(6,2) NOT NULL,
    multiplier numeric(4,2) DEFAULT 1.0 NOT NULL,
    shift_id uuid,
    timesheet_id uuid,
    description text,
    status character varying(50) DEFAULT 'approved'::character varying NOT NULL,
    requested_at timestamp without time zone,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    rejected_reason text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_training_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_training_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    course_id uuid NOT NULL,
    status text DEFAULT 'enrolled'::text NOT NULL,
    score_percent integer,
    started_on date,
    completed_on date,
    expires_on date,
    certificate_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    expiry_date date,
    score numeric(5,2),
    attempts integer DEFAULT 0 NOT NULL
);


--
-- Name: hrms_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'employee'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    totp_secret text,
    mfa_enabled boolean DEFAULT false NOT NULL,
    last_login timestamp with time zone,
    employee_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    totp_enabled boolean DEFAULT false NOT NULL,
    last_login_at timestamp without time zone,
    password_changed_at timestamp without time zone,
    password_reset_token text,
    password_reset_expiry timestamp without time zone
);


--
-- Name: hrms_whs_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hrms_whs_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reported_by uuid NOT NULL,
    employee_id uuid,
    occurred_at timestamp with time zone NOT NULL,
    type text DEFAULT 'near-miss'::text NOT NULL,
    severity text DEFAULT 'low'::text NOT NULL,
    location text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    corrective_actions text,
    closed_on date,
    lost_time boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone DEFAULT now()
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    CONSTRAINT buckets_versioning_dark_check CHECK ((versioning_status = 'DISABLED'::text)),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hrms_module_subscriptions; Type: TABLE; Schema: tenant; Owner: -
--

CREATE TABLE tenant.hrms_module_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    module_id uuid NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    enabled_at timestamp with time zone,
    disabled_at timestamp with time zone,
    enabled_by uuid,
    disabled_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: module_subscriptions; Type: TABLE; Schema: tenant; Owner: -
--

CREATE TABLE tenant.module_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    module_id uuid NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    enabled_at timestamp with time zone,
    disabled_at timestamp with time zone,
    enabled_by uuid,
    disabled_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: tenant; Owner: -
--

CREATE TABLE tenant.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    setting_key text NOT NULL,
    setting_value text DEFAULT ''::text NOT NULL,
    is_sensitive boolean DEFAULT false NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: aggregatedcounter id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.aggregatedcounter ALTER COLUMN id SET DEFAULT nextval('hangfire.aggregatedcounter_id_seq'::regclass);


--
-- Name: counter id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.counter ALTER COLUMN id SET DEFAULT nextval('hangfire.counter_id_seq'::regclass);


--
-- Name: hash id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.hash ALTER COLUMN id SET DEFAULT nextval('hangfire.hash_id_seq'::regclass);


--
-- Name: job id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.job ALTER COLUMN id SET DEFAULT nextval('hangfire.job_id_seq'::regclass);


--
-- Name: jobparameter id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.jobparameter ALTER COLUMN id SET DEFAULT nextval('hangfire.jobparameter_id_seq'::regclass);


--
-- Name: jobqueue id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.jobqueue ALTER COLUMN id SET DEFAULT nextval('hangfire.jobqueue_id_seq'::regclass);


--
-- Name: list id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.list ALTER COLUMN id SET DEFAULT nextval('hangfire.list_id_seq'::regclass);


--
-- Name: set id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.set ALTER COLUMN id SET DEFAULT nextval('hangfire.set_id_seq'::regclass);


--
-- Name: state id; Type: DEFAULT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.state ALTER COLUMN id SET DEFAULT nextval('hangfire.state_id_seq'::regclass);


--
-- Name: hrms_super_admin_events hrms_super_admin_events_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.hrms_super_admin_events
    ADD CONSTRAINT hrms_super_admin_events_pkey PRIMARY KEY (id);


--
-- Name: super_admin_events super_admin_events_pkey; Type: CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.super_admin_events
    ADD CONSTRAINT super_admin_events_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: hrms_modules hrms_modules_module_key_key; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.hrms_modules
    ADD CONSTRAINT hrms_modules_module_key_key UNIQUE (module_key);


--
-- Name: hrms_modules hrms_modules_pkey; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.hrms_modules
    ADD CONSTRAINT hrms_modules_pkey PRIMARY KEY (id);


--
-- Name: hrms_plan_default_modules hrms_plan_default_modules_pkey; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.hrms_plan_default_modules
    ADD CONSTRAINT hrms_plan_default_modules_pkey PRIMARY KEY (id);


--
-- Name: hrms_plan_default_modules hrms_plan_default_modules_plan_module_id_key; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.hrms_plan_default_modules
    ADD CONSTRAINT hrms_plan_default_modules_plan_module_id_key UNIQUE (plan, module_id);


--
-- Name: modules modules_module_key_key; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.modules
    ADD CONSTRAINT modules_module_key_key UNIQUE (module_key);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: plan_default_modules plan_default_modules_pkey; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.plan_default_modules
    ADD CONSTRAINT plan_default_modules_pkey PRIMARY KEY (id);


--
-- Name: plan_default_modules plan_default_modules_plan_module_id_key; Type: CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.plan_default_modules
    ADD CONSTRAINT plan_default_modules_plan_module_id_key UNIQUE (plan, module_id);


--
-- Name: aggregatedcounter aggregatedcounter_key_key; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.aggregatedcounter
    ADD CONSTRAINT aggregatedcounter_key_key UNIQUE (key);


--
-- Name: aggregatedcounter aggregatedcounter_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.aggregatedcounter
    ADD CONSTRAINT aggregatedcounter_pkey PRIMARY KEY (id);


--
-- Name: counter counter_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.counter
    ADD CONSTRAINT counter_pkey PRIMARY KEY (id);


--
-- Name: hash hash_key_field_key; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.hash
    ADD CONSTRAINT hash_key_field_key UNIQUE (key, field);


--
-- Name: hash hash_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.hash
    ADD CONSTRAINT hash_pkey PRIMARY KEY (id);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (id);


--
-- Name: jobparameter jobparameter_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.jobparameter
    ADD CONSTRAINT jobparameter_pkey PRIMARY KEY (id);


--
-- Name: jobqueue jobqueue_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.jobqueue
    ADD CONSTRAINT jobqueue_pkey PRIMARY KEY (id);


--
-- Name: list list_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.list
    ADD CONSTRAINT list_pkey PRIMARY KEY (id);


--
-- Name: lock lock_resource_key; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.lock
    ADD CONSTRAINT lock_resource_key UNIQUE (resource);

ALTER TABLE ONLY hangfire.lock REPLICA IDENTITY USING INDEX lock_resource_key;


--
-- Name: schema schema_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.schema
    ADD CONSTRAINT schema_pkey PRIMARY KEY (version);


--
-- Name: server server_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.server
    ADD CONSTRAINT server_pkey PRIMARY KEY (id);


--
-- Name: set set_key_value_key; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.set
    ADD CONSTRAINT set_key_value_key UNIQUE (key, value);


--
-- Name: set set_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.set
    ADD CONSTRAINT set_pkey PRIMARY KEY (id);


--
-- Name: state state_pkey; Type: CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.state
    ADD CONSTRAINT state_pkey PRIMARY KEY (id);


--
-- Name: hrms_super_admin_users hrms_super_admin_users_email_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.hrms_super_admin_users
    ADD CONSTRAINT hrms_super_admin_users_email_key UNIQUE (email);


--
-- Name: hrms_super_admin_users hrms_super_admin_users_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.hrms_super_admin_users
    ADD CONSTRAINT hrms_super_admin_users_pkey PRIMARY KEY (id);


--
-- Name: super_admin_users super_admin_users_email_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.super_admin_users
    ADD CONSTRAINT super_admin_users_email_key UNIQUE (email);


--
-- Name: super_admin_users super_admin_users_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.super_admin_users
    ADD CONSTRAINT super_admin_users_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_subdomain_key; Type: CONSTRAINT; Schema: iam; Owner: -
--

ALTER TABLE ONLY iam.tenants
    ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);


--
-- Name: hrms_crm_accounts crm_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_accounts
    ADD CONSTRAINT crm_accounts_pkey PRIMARY KEY (id);


--
-- Name: hrms_crm_activities crm_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_activities
    ADD CONSTRAINT crm_activities_pkey PRIMARY KEY (id);


--
-- Name: hrms_crm_contacts crm_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_contacts
    ADD CONSTRAINT crm_contacts_pkey PRIMARY KEY (id);


--
-- Name: hrms_crm_deals crm_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_deals
    ADD CONSTRAINT crm_deals_pkey PRIMARY KEY (id);


--
-- Name: hrms_crm_leads crm_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_leads
    ADD CONSTRAINT crm_leads_pkey PRIMARY KEY (id);


--
-- Name: hrms_ess_announcements ess_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ess_announcements
    ADD CONSTRAINT ess_announcements_pkey PRIMARY KEY (id);


--
-- Name: hrms_ess_quick_links ess_quick_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ess_quick_links
    ADD CONSTRAINT ess_quick_links_pkey PRIMARY KEY (id);


--
-- Name: hrms_expense_claims expense_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_expense_claims
    ADD CONSTRAINT expense_claims_pkey PRIMARY KEY (id);


--
-- Name: hrms_applications hrms_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_applications
    ADD CONSTRAINT hrms_applications_pkey PRIMARY KEY (id);


--
-- Name: hrms_asset_assignments hrms_asset_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_asset_assignments
    ADD CONSTRAINT hrms_asset_assignments_pkey PRIMARY KEY (id);


--
-- Name: hrms_assets hrms_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_assets
    ADD CONSTRAINT hrms_assets_pkey PRIMARY KEY (id);


--
-- Name: hrms_audit_logs hrms_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_audit_logs
    ADD CONSTRAINT hrms_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: hrms_candidates hrms_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_candidates
    ADD CONSTRAINT hrms_candidates_pkey PRIMARY KEY (id);


--
-- Name: hrms_competencies hrms_competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_competencies
    ADD CONSTRAINT hrms_competencies_pkey PRIMARY KEY (id);


--
-- Name: hrms_competency_assessments hrms_competency_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_competency_assessments
    ADD CONSTRAINT hrms_competency_assessments_pkey PRIMARY KEY (id);


--
-- Name: hrms_compliance_lock_exceptions hrms_compliance_lock_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_compliance_lock_exceptions
    ADD CONSTRAINT hrms_compliance_lock_exceptions_pkey PRIMARY KEY (id);


--
-- Name: hrms_compliance_tracking hrms_compliance_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_compliance_tracking
    ADD CONSTRAINT hrms_compliance_tracking_pkey PRIMARY KEY (id);


--
-- Name: hrms_contracts hrms_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_contracts
    ADD CONSTRAINT hrms_contracts_pkey PRIMARY KEY (id);


--
-- Name: hrms_courses hrms_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_courses
    ADD CONSTRAINT hrms_courses_pkey PRIMARY KEY (id);


--
-- Name: hrms_departments hrms_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_departments
    ADD CONSTRAINT hrms_departments_pkey PRIMARY KEY (id);


--
-- Name: hrms_diversity_data hrms_diversity_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_diversity_data
    ADD CONSTRAINT hrms_diversity_data_pkey PRIMARY KEY (id);


--
-- Name: hrms_documents hrms_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_documents
    ADD CONSTRAINT hrms_documents_pkey PRIMARY KEY (id);


--
-- Name: hrms_emergency_contacts hrms_emergency_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_emergency_contacts
    ADD CONSTRAINT hrms_emergency_contacts_pkey PRIMARY KEY (id);


--
-- Name: hrms_employee_availability hrms_employee_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_availability
    ADD CONSTRAINT hrms_employee_availability_pkey PRIMARY KEY (id);


--
-- Name: hrms_employee_benefits hrms_employee_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_benefits
    ADD CONSTRAINT hrms_employee_benefits_pkey PRIMARY KEY (id);


--
-- Name: hrms_employee_experience hrms_employee_experience_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_experience
    ADD CONSTRAINT hrms_employee_experience_pkey PRIMARY KEY (id);


--
-- Name: hrms_employee_notes hrms_employee_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_notes
    ADD CONSTRAINT hrms_employee_notes_pkey PRIMARY KEY (id);


--
-- Name: hrms_employees hrms_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employees
    ADD CONSTRAINT hrms_employees_pkey PRIMARY KEY (id);


--
-- Name: hrms_ess_onboarding hrms_ess_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ess_onboarding
    ADD CONSTRAINT hrms_ess_onboarding_pkey PRIMARY KEY (id);


--
-- Name: hrms_grievances hrms_grievances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_grievances
    ADD CONSTRAINT hrms_grievances_pkey PRIMARY KEY (id);


--
-- Name: hrms_headcount_plan hrms_headcount_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_headcount_plan
    ADD CONSTRAINT hrms_headcount_plan_pkey PRIMARY KEY (id);


--
-- Name: hrms_job_requisitions hrms_job_requisitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_job_requisitions
    ADD CONSTRAINT hrms_job_requisitions_pkey PRIMARY KEY (id);


--
-- Name: hrms_leave_requests hrms_leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_leave_requests
    ADD CONSTRAINT hrms_leave_requests_pkey PRIMARY KEY (id);


--
-- Name: hrms_notifications hrms_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_notifications
    ADD CONSTRAINT hrms_notifications_pkey PRIMARY KEY (id);


--
-- Name: hrms_offer_letter_events hrms_offer_letter_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letter_events
    ADD CONSTRAINT hrms_offer_letter_events_pkey PRIMARY KEY (id);


--
-- Name: hrms_offer_letter_templates hrms_offer_letter_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letter_templates
    ADD CONSTRAINT hrms_offer_letter_templates_pkey PRIMARY KEY (id);


--
-- Name: hrms_offer_letters hrms_offer_letters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letters
    ADD CONSTRAINT hrms_offer_letters_pkey PRIMARY KEY (id);


--
-- Name: hrms_onboarding_records hrms_onboarding_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_onboarding_records
    ADD CONSTRAINT hrms_onboarding_records_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_behaviour_plans hrms_participant_behaviour_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_behaviour_plans
    ADD CONSTRAINT hrms_participant_behaviour_plans_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_health_appointments hrms_participant_health_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_health_appointments
    ADD CONSTRAINT hrms_participant_health_appointments_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_health_conditions hrms_participant_health_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_health_conditions
    ADD CONSTRAINT hrms_participant_health_conditions_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_incidents hrms_participant_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_incidents
    ADD CONSTRAINT hrms_participant_incidents_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_medication_logs hrms_participant_medication_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_medication_logs
    ADD CONSTRAINT hrms_participant_medication_logs_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_medications hrms_participant_medications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_medications
    ADD CONSTRAINT hrms_participant_medications_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_restrictive_practices hrms_participant_restrictive_practices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_restrictive_practices
    ADD CONSTRAINT hrms_participant_restrictive_practices_pkey PRIMARY KEY (id);


--
-- Name: hrms_payroll_records hrms_payroll_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_payroll_records
    ADD CONSTRAINT hrms_payroll_records_pkey PRIMARY KEY (id);


--
-- Name: hrms_performance_goals hrms_performance_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_goals
    ADD CONSTRAINT hrms_performance_goals_pkey PRIMARY KEY (id);


--
-- Name: hrms_performance_reviews hrms_performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_reviews
    ADD CONSTRAINT hrms_performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: hrms_platform_announcements hrms_platform_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_platform_announcements
    ADD CONSTRAINT hrms_platform_announcements_pkey PRIMARY KEY (id);


--
-- Name: hrms_positions hrms_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_positions
    ADD CONSTRAINT hrms_positions_pkey PRIMARY KEY (id);


--
-- Name: hrms_promotion_events hrms_promotion_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_promotion_events
    ADD CONSTRAINT hrms_promotion_events_pkey PRIMARY KEY (id);


--
-- Name: hrms_promotion_requests hrms_promotion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_promotion_requests
    ADD CONSTRAINT hrms_promotion_requests_pkey PRIMARY KEY (id);


--
-- Name: hrms_public_holidays hrms_public_holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_public_holidays
    ADD CONSTRAINT hrms_public_holidays_pkey PRIMARY KEY (id);


--
-- Name: hrms_recognitions hrms_recognitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_recognitions
    ADD CONSTRAINT hrms_recognitions_pkey PRIMARY KEY (id);


--
-- Name: hrms_referrals hrms_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_referrals
    ADD CONSTRAINT hrms_referrals_pkey PRIMARY KEY (id);


--
-- Name: hrms_roster_template_slots hrms_roster_template_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_roster_template_slots
    ADD CONSTRAINT hrms_roster_template_slots_pkey PRIMARY KEY (id);


--
-- Name: hrms_roster_templates hrms_roster_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_roster_templates
    ADD CONSTRAINT hrms_roster_templates_pkey PRIMARY KEY (id);


--
-- Name: hrms_salary_reviews hrms_salary_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_salary_reviews
    ADD CONSTRAINT hrms_salary_reviews_pkey PRIMARY KEY (id);


--
-- Name: hrms_screening_records hrms_screening_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_screening_records
    ADD CONSTRAINT hrms_screening_records_pkey PRIMARY KEY (id);


--
-- Name: hrms_separation_events hrms_separation_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_separation_events
    ADD CONSTRAINT hrms_separation_events_pkey PRIMARY KEY (id);


--
-- Name: hrms_separation_records hrms_separation_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_separation_records
    ADD CONSTRAINT hrms_separation_records_pkey PRIMARY KEY (id);


--
-- Name: hrms_shift_swap_requests hrms_shift_swap_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shift_swap_requests
    ADD CONSTRAINT hrms_shift_swap_requests_pkey PRIMARY KEY (id);


--
-- Name: hrms_shifts hrms_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shifts
    ADD CONSTRAINT hrms_shifts_pkey PRIMARY KEY (id);


--
-- Name: hrms_super_admins hrms_super_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_super_admins
    ADD CONSTRAINT hrms_super_admins_pkey PRIMARY KEY (id);


--
-- Name: hrms_super_contributions hrms_super_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_super_contributions
    ADD CONSTRAINT hrms_super_contributions_pkey PRIMARY KEY (id);


--
-- Name: hrms_super_funds hrms_super_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_super_funds
    ADD CONSTRAINT hrms_super_funds_pkey PRIMARY KEY (id);


--
-- Name: hrms_supervision_records hrms_supervision_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_supervision_records
    ADD CONSTRAINT hrms_supervision_records_pkey PRIMARY KEY (id);


--
-- Name: hrms_survey_responses hrms_survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_survey_responses
    ADD CONSTRAINT hrms_survey_responses_pkey PRIMARY KEY (id);


--
-- Name: hrms_surveys hrms_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_surveys
    ADD CONSTRAINT hrms_surveys_pkey PRIMARY KEY (id);


--
-- Name: hrms_tenant_modules hrms_tenant_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_tenant_modules
    ADD CONSTRAINT hrms_tenant_modules_pkey PRIMARY KEY (id);


--
-- Name: hrms_tenants hrms_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_tenants
    ADD CONSTRAINT hrms_tenants_pkey PRIMARY KEY (id);


--
-- Name: hrms_timesheets hrms_timesheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_timesheets
    ADD CONSTRAINT hrms_timesheets_pkey PRIMARY KEY (id);


--
-- Name: hrms_toil_balances hrms_toil_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_toil_balances
    ADD CONSTRAINT hrms_toil_balances_pkey PRIMARY KEY (id);


--
-- Name: hrms_toil_entries hrms_toil_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_toil_entries
    ADD CONSTRAINT hrms_toil_entries_pkey PRIMARY KEY (id);


--
-- Name: hrms_training_records hrms_training_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_training_records
    ADD CONSTRAINT hrms_training_records_pkey PRIMARY KEY (id);


--
-- Name: hrms_users hrms_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_users
    ADD CONSTRAINT hrms_users_pkey PRIMARY KEY (id);


--
-- Name: hrms_whs_incidents hrms_whs_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_whs_incidents
    ADD CONSTRAINT hrms_whs_incidents_pkey PRIMARY KEY (id);


--
-- Name: hrms_ndis_audit_actions ndis_audit_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_audit_actions
    ADD CONSTRAINT ndis_audit_actions_pkey PRIMARY KEY (id);


--
-- Name: hrms_ndis_audits ndis_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_audits
    ADD CONSTRAINT ndis_audits_pkey PRIMARY KEY (id);


--
-- Name: hrms_ndis_incident_actions ndis_incident_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_incident_actions
    ADD CONSTRAINT ndis_incident_actions_pkey PRIMARY KEY (id);


--
-- Name: hrms_ndis_incidents ndis_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_incidents
    ADD CONSTRAINT ndis_incidents_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_contacts participant_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_contacts
    ADD CONSTRAINT participant_contacts_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_goals participant_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_goals
    ADD CONSTRAINT participant_goals_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_notes participant_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_notes
    ADD CONSTRAINT participant_notes_pkey PRIMARY KEY (id);


--
-- Name: hrms_participant_support_plans participant_support_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_support_plans
    ADD CONSTRAINT participant_support_plans_pkey PRIMARY KEY (id);


--
-- Name: hrms_participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: hrms_payroll_run_entries payroll_run_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_payroll_run_entries
    ADD CONSTRAINT payroll_run_entries_pkey PRIMARY KEY (id);


--
-- Name: hrms_payroll_runs payroll_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_payroll_runs
    ADD CONSTRAINT payroll_runs_pkey PRIMARY KEY (id);


--
-- Name: hrms_saved_reports saved_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_saved_reports
    ADD CONSTRAINT saved_reports_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: hrms_module_subscriptions hrms_module_subscriptions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.hrms_module_subscriptions
    ADD CONSTRAINT hrms_module_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: hrms_module_subscriptions hrms_module_subscriptions_tenant_id_module_id_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.hrms_module_subscriptions
    ADD CONSTRAINT hrms_module_subscriptions_tenant_id_module_id_key UNIQUE (tenant_id, module_id);


--
-- Name: module_subscriptions module_subscriptions_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.module_subscriptions
    ADD CONSTRAINT module_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: module_subscriptions module_subscriptions_tenant_id_module_id_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.module_subscriptions
    ADD CONSTRAINT module_subscriptions_tenant_id_module_id_key UNIQUE (tenant_id, module_id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: settings settings_tenant_id_setting_key_key; Type: CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.settings
    ADD CONSTRAINT settings_tenant_id_setting_key_key UNIQUE (tenant_id, setting_key);


--
-- Name: idx_audit_super_admin_events_action; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_audit_super_admin_events_action ON audit.super_admin_events USING btree (action);


--
-- Name: idx_audit_super_admin_events_created_at; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_audit_super_admin_events_created_at ON audit.super_admin_events USING btree (created_at DESC);


--
-- Name: idx_audit_super_admin_events_entity; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_audit_super_admin_events_entity ON audit.super_admin_events USING btree (entity_type, entity_id);


--
-- Name: idx_audit_super_admin_events_super_admin_id; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_audit_super_admin_events_super_admin_id ON audit.super_admin_events USING btree (super_admin_id);


--
-- Name: idx_hrms_sa_events_admin; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_hrms_sa_events_admin ON audit.hrms_super_admin_events USING btree (super_admin_id);


--
-- Name: idx_hrms_sa_events_created; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_hrms_sa_events_created ON audit.hrms_super_admin_events USING btree (created_at DESC);


--
-- Name: idx_hrms_sa_events_entity; Type: INDEX; Schema: audit; Owner: -
--

CREATE INDEX idx_hrms_sa_events_entity ON audit.hrms_super_admin_events USING btree (entity_type, entity_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: idx_catalog_modules_category; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX idx_catalog_modules_category ON catalog.modules USING btree (category);


--
-- Name: idx_catalog_modules_is_available; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX idx_catalog_modules_is_available ON catalog.modules USING btree (is_available);


--
-- Name: idx_catalog_modules_module_key; Type: INDEX; Schema: catalog; Owner: -
--

CREATE UNIQUE INDEX idx_catalog_modules_module_key ON catalog.modules USING btree (module_key);


--
-- Name: idx_catalog_plan_default_modules_plan; Type: INDEX; Schema: catalog; Owner: -
--

CREATE INDEX idx_catalog_plan_default_modules_plan ON catalog.plan_default_modules USING btree (plan);


--
-- Name: ix_hangfire_counter_expireat; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_counter_expireat ON hangfire.counter USING btree (expireat);


--
-- Name: ix_hangfire_counter_key; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_counter_key ON hangfire.counter USING btree (key);


--
-- Name: ix_hangfire_hash_expireat; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_hash_expireat ON hangfire.hash USING btree (expireat);


--
-- Name: ix_hangfire_job_expireat; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_job_expireat ON hangfire.job USING btree (expireat);


--
-- Name: ix_hangfire_job_statename; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_job_statename ON hangfire.job USING btree (statename);


--
-- Name: ix_hangfire_jobparameter_jobidandname; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_jobparameter_jobidandname ON hangfire.jobparameter USING btree (jobid, name);


--
-- Name: ix_hangfire_jobqueue_fetchedat_queue_jobid; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_jobqueue_fetchedat_queue_jobid ON hangfire.jobqueue USING btree (fetchedat NULLS FIRST, queue, jobid);


--
-- Name: ix_hangfire_jobqueue_jobidandqueue; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_jobqueue_jobidandqueue ON hangfire.jobqueue USING btree (jobid, queue);


--
-- Name: ix_hangfire_jobqueue_queueandfetchedat; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_jobqueue_queueandfetchedat ON hangfire.jobqueue USING btree (queue, fetchedat);


--
-- Name: ix_hangfire_list_expireat; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_list_expireat ON hangfire.list USING btree (expireat);


--
-- Name: ix_hangfire_set_expireat; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_set_expireat ON hangfire.set USING btree (expireat);


--
-- Name: ix_hangfire_set_key_score; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_set_key_score ON hangfire.set USING btree (key, score);


--
-- Name: ix_hangfire_state_jobid; Type: INDEX; Schema: hangfire; Owner: -
--

CREATE INDEX ix_hangfire_state_jobid ON hangfire.state USING btree (jobid);


--
-- Name: idx_iam_super_admin_users_email; Type: INDEX; Schema: iam; Owner: -
--

CREATE UNIQUE INDEX idx_iam_super_admin_users_email ON iam.super_admin_users USING btree (email);


--
-- Name: idx_iam_tenants_is_active; Type: INDEX; Schema: iam; Owner: -
--

CREATE INDEX idx_iam_tenants_is_active ON iam.tenants USING btree (is_active);


--
-- Name: idx_iam_tenants_plan; Type: INDEX; Schema: iam; Owner: -
--

CREATE INDEX idx_iam_tenants_plan ON iam.tenants USING btree (plan);


--
-- Name: idx_iam_tenants_subdomain; Type: INDEX; Schema: iam; Owner: -
--

CREATE UNIQUE INDEX idx_iam_tenants_subdomain ON iam.tenants USING btree (subdomain);


--
-- Name: announcements_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_active_idx ON public.hrms_platform_announcements USING btree (is_active);


--
-- Name: announcements_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX announcements_created_idx ON public.hrms_platform_announcements USING btree (created_at);


--
-- Name: audit_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_created_idx ON public.hrms_audit_logs USING btree (created_at);


--
-- Name: audit_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_tenant_idx ON public.hrms_audit_logs USING btree (tenant_id);


--
-- Name: availability_emp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX availability_emp_idx ON public.hrms_employee_availability USING btree (employee_id);


--
-- Name: availability_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX availability_tenant_idx ON public.hrms_employee_availability USING btree (tenant_id);


--
-- Name: behaviour_plans_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX behaviour_plans_participant_idx ON public.hrms_participant_behaviour_plans USING btree (participant_id);


--
-- Name: behaviour_plans_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX behaviour_plans_tenant_idx ON public.hrms_participant_behaviour_plans USING btree (tenant_id);


--
-- Name: crm_accounts_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_accounts_name_idx ON public.hrms_crm_accounts USING btree (name);


--
-- Name: crm_accounts_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_accounts_tenant_idx ON public.hrms_crm_accounts USING btree (tenant_id);


--
-- Name: crm_activities_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_activities_assigned_idx ON public.hrms_crm_activities USING btree (assigned_to);


--
-- Name: crm_activities_related_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_activities_related_idx ON public.hrms_crm_activities USING btree (related_type, related_id);


--
-- Name: crm_activities_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_activities_tenant_idx ON public.hrms_crm_activities USING btree (tenant_id);


--
-- Name: crm_contacts_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_contacts_account_idx ON public.hrms_crm_contacts USING btree (account_id);


--
-- Name: crm_contacts_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_contacts_tenant_idx ON public.hrms_crm_contacts USING btree (tenant_id);


--
-- Name: crm_deals_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_deals_account_idx ON public.hrms_crm_deals USING btree (account_id);


--
-- Name: crm_deals_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_deals_stage_idx ON public.hrms_crm_deals USING btree (stage);


--
-- Name: crm_deals_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_deals_tenant_idx ON public.hrms_crm_deals USING btree (tenant_id);


--
-- Name: crm_leads_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_leads_assigned_idx ON public.hrms_crm_leads USING btree (assigned_to);


--
-- Name: crm_leads_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_leads_status_idx ON public.hrms_crm_leads USING btree (status);


--
-- Name: crm_leads_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_leads_tenant_idx ON public.hrms_crm_leads USING btree (tenant_id);


--
-- Name: diversity_employee_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX diversity_employee_unique ON public.hrms_diversity_data USING btree (tenant_id, employee_id);


--
-- Name: docs_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX docs_employee_idx ON public.hrms_documents USING btree (employee_id);


--
-- Name: docs_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX docs_tenant_idx ON public.hrms_documents USING btree (tenant_id);


--
-- Name: employee_experience_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_experience_employee_idx ON public.hrms_employee_experience USING btree (employee_id);


--
-- Name: employee_experience_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_experience_tenant_idx ON public.hrms_employee_experience USING btree (tenant_id);


--
-- Name: employee_notes_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_notes_employee_idx ON public.hrms_employee_notes USING btree (employee_id);


--
-- Name: employee_notes_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_notes_tenant_idx ON public.hrms_employee_notes USING btree (tenant_id);


--
-- Name: employees_number_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employees_number_tenant ON public.hrms_employees USING btree (tenant_id, employee_number);


--
-- Name: employees_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_tenant_idx ON public.hrms_employees USING btree (tenant_id);


--
-- Name: ess_announcements_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ess_announcements_tenant_idx ON public.hrms_ess_announcements USING btree (tenant_id);


--
-- Name: ess_onboarding_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ess_onboarding_employee_idx ON public.hrms_ess_onboarding USING btree (employee_id);


--
-- Name: ess_onboarding_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ess_onboarding_tenant_idx ON public.hrms_ess_onboarding USING btree (tenant_id);


--
-- Name: ess_quick_links_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ess_quick_links_tenant_idx ON public.hrms_ess_quick_links USING btree (tenant_id);


--
-- Name: expense_claims_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expense_claims_employee_idx ON public.hrms_expense_claims USING btree (employee_id);


--
-- Name: expense_claims_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expense_claims_status_idx ON public.hrms_expense_claims USING btree (status);


--
-- Name: expense_claims_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expense_claims_tenant_idx ON public.hrms_expense_claims USING btree (tenant_id);


--
-- Name: health_appointments_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX health_appointments_participant_idx ON public.hrms_participant_health_appointments USING btree (participant_id);


--
-- Name: health_appointments_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX health_appointments_tenant_idx ON public.hrms_participant_health_appointments USING btree (tenant_id);


--
-- Name: health_conditions_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX health_conditions_participant_idx ON public.hrms_participant_health_conditions USING btree (participant_id);


--
-- Name: health_conditions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX health_conditions_tenant_idx ON public.hrms_participant_health_conditions USING btree (tenant_id);


--
-- Name: hrms_ess_onboarding_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX hrms_ess_onboarding_unique ON public.hrms_ess_onboarding USING btree (tenant_id, employee_id);


--
-- Name: leave_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_date_idx ON public.hrms_leave_requests USING btree (start_date);


--
-- Name: leave_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_employee_idx ON public.hrms_leave_requests USING btree (employee_id);


--
-- Name: leave_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_status_idx ON public.hrms_leave_requests USING btree (status);


--
-- Name: leave_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leave_tenant_idx ON public.hrms_leave_requests USING btree (tenant_id);


--
-- Name: medication_logs_medication_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_logs_medication_idx ON public.hrms_participant_medication_logs USING btree (medication_id);


--
-- Name: medication_logs_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_logs_participant_idx ON public.hrms_participant_medication_logs USING btree (participant_id);


--
-- Name: medication_logs_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medication_logs_tenant_idx ON public.hrms_participant_medication_logs USING btree (tenant_id);


--
-- Name: ndis_audit_actions_audit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_audit_actions_audit_idx ON public.hrms_ndis_audit_actions USING btree (audit_id);


--
-- Name: ndis_audit_actions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_audit_actions_tenant_idx ON public.hrms_ndis_audit_actions USING btree (tenant_id);


--
-- Name: ndis_audits_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_audits_date_idx ON public.hrms_ndis_audits USING btree (scheduled_date);


--
-- Name: ndis_audits_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_audits_status_idx ON public.hrms_ndis_audits USING btree (status);


--
-- Name: ndis_audits_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_audits_tenant_idx ON public.hrms_ndis_audits USING btree (tenant_id);


--
-- Name: ndis_incident_actions_incident_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_incident_actions_incident_idx ON public.hrms_ndis_incident_actions USING btree (incident_id);


--
-- Name: ndis_incident_actions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_incident_actions_tenant_idx ON public.hrms_ndis_incident_actions USING btree (tenant_id);


--
-- Name: ndis_incidents_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_incidents_date_idx ON public.hrms_ndis_incidents USING btree (incident_date);


--
-- Name: ndis_incidents_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_incidents_participant_idx ON public.hrms_ndis_incidents USING btree (participant_id);


--
-- Name: ndis_incidents_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_incidents_status_idx ON public.hrms_ndis_incidents USING btree (status);


--
-- Name: ndis_incidents_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ndis_incidents_tenant_idx ON public.hrms_ndis_incidents USING btree (tenant_id);


--
-- Name: notifications_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_idx ON public.hrms_notifications USING btree (user_id);


--
-- Name: offer_events_offer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX offer_events_offer_idx ON public.hrms_offer_letter_events USING btree (offer_id);


--
-- Name: offer_letters_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX offer_letters_email_idx ON public.hrms_offer_letters USING btree (candidate_email);


--
-- Name: offer_letters_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX offer_letters_status_idx ON public.hrms_offer_letters USING btree (status);


--
-- Name: offer_letters_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX offer_letters_tenant_idx ON public.hrms_offer_letters USING btree (tenant_id);


--
-- Name: offer_tmpl_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX offer_tmpl_tenant_idx ON public.hrms_offer_letter_templates USING btree (tenant_id);


--
-- Name: participant_contacts_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_contacts_participant_idx ON public.hrms_participant_contacts USING btree (participant_id);


--
-- Name: participant_contacts_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_contacts_tenant_idx ON public.hrms_participant_contacts USING btree (tenant_id);


--
-- Name: participant_goals_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_goals_participant_idx ON public.hrms_participant_goals USING btree (participant_id);


--
-- Name: participant_goals_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_goals_tenant_idx ON public.hrms_participant_goals USING btree (tenant_id);


--
-- Name: participant_incidents_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_incidents_participant_idx ON public.hrms_participant_incidents USING btree (participant_id);


--
-- Name: participant_incidents_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_incidents_tenant_idx ON public.hrms_participant_incidents USING btree (tenant_id);


--
-- Name: participant_medications_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_medications_participant_idx ON public.hrms_participant_medications USING btree (participant_id);


--
-- Name: participant_medications_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_medications_tenant_idx ON public.hrms_participant_medications USING btree (tenant_id);


--
-- Name: participant_notes_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_notes_participant_idx ON public.hrms_participant_notes USING btree (participant_id);


--
-- Name: participant_notes_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_notes_tenant_idx ON public.hrms_participant_notes USING btree (tenant_id);


--
-- Name: participant_support_plans_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_support_plans_participant_idx ON public.hrms_participant_support_plans USING btree (participant_id);


--
-- Name: participant_support_plans_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_support_plans_tenant_idx ON public.hrms_participant_support_plans USING btree (tenant_id);


--
-- Name: participants_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participants_tenant_idx ON public.hrms_participants USING btree (tenant_id);


--
-- Name: payroll_run_entries_run_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payroll_run_entries_run_idx ON public.hrms_payroll_run_entries USING btree (run_id);


--
-- Name: payroll_run_entries_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payroll_run_entries_tenant_idx ON public.hrms_payroll_run_entries USING btree (tenant_id);


--
-- Name: payroll_runs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payroll_runs_status_idx ON public.hrms_payroll_runs USING btree (status);


--
-- Name: payroll_runs_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payroll_runs_tenant_idx ON public.hrms_payroll_runs USING btree (tenant_id);


--
-- Name: perf_goals_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX perf_goals_employee_idx ON public.hrms_performance_goals USING btree (employee_id);


--
-- Name: perf_goals_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX perf_goals_review_idx ON public.hrms_performance_goals USING btree (review_id);


--
-- Name: perf_goals_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX perf_goals_tenant_idx ON public.hrms_performance_goals USING btree (tenant_id);


--
-- Name: ph_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ph_date_idx ON public.hrms_public_holidays USING btree (date);


--
-- Name: ph_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ph_tenant_idx ON public.hrms_public_holidays USING btree (tenant_id);


--
-- Name: ph_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ph_unique ON public.hrms_public_holidays USING btree (tenant_id, date, name);


--
-- Name: promotion_events_promo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promotion_events_promo_idx ON public.hrms_promotion_events USING btree (promotion_id);


--
-- Name: promotions_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promotions_employee_idx ON public.hrms_promotion_requests USING btree (employee_id);


--
-- Name: promotions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promotions_status_idx ON public.hrms_promotion_requests USING btree (status);


--
-- Name: promotions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promotions_tenant_idx ON public.hrms_promotion_requests USING btree (tenant_id);


--
-- Name: restrictive_practices_participant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restrictive_practices_participant_idx ON public.hrms_participant_restrictive_practices USING btree (participant_id);


--
-- Name: restrictive_practices_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX restrictive_practices_tenant_idx ON public.hrms_participant_restrictive_practices USING btree (tenant_id);


--
-- Name: roster_template_slots_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX roster_template_slots_template_idx ON public.hrms_roster_template_slots USING btree (template_id);


--
-- Name: roster_templates_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX roster_templates_tenant_idx ON public.hrms_roster_templates USING btree (tenant_id);


--
-- Name: salary_reviews_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX salary_reviews_employee_idx ON public.hrms_salary_reviews USING btree (employee_id);


--
-- Name: salary_reviews_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX salary_reviews_status_idx ON public.hrms_salary_reviews USING btree (status);


--
-- Name: salary_reviews_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX salary_reviews_tenant_idx ON public.hrms_salary_reviews USING btree (tenant_id);


--
-- Name: saved_reports_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX saved_reports_tenant_idx ON public.hrms_saved_reports USING btree (tenant_id);


--
-- Name: separation_events_sep_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX separation_events_sep_idx ON public.hrms_separation_events USING btree (separation_id);


--
-- Name: shift_swap_requests_shift_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_swap_requests_shift_idx ON public.hrms_shift_swap_requests USING btree (shift_id);


--
-- Name: shift_swap_requests_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shift_swap_requests_tenant_idx ON public.hrms_shift_swap_requests USING btree (tenant_id);


--
-- Name: shifts_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shifts_employee_idx ON public.hrms_shifts USING btree (employee_id);


--
-- Name: shifts_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shifts_tenant_idx ON public.hrms_shifts USING btree (tenant_id);


--
-- Name: shifts_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shifts_time_idx ON public.hrms_shifts USING btree (start_time, end_time);


--
-- Name: super_contributions_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX super_contributions_employee_idx ON public.hrms_super_contributions USING btree (employee_id);


--
-- Name: super_contributions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX super_contributions_tenant_idx ON public.hrms_super_contributions USING btree (tenant_id);


--
-- Name: super_funds_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX super_funds_employee_idx ON public.hrms_super_funds USING btree (employee_id);


--
-- Name: super_funds_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX super_funds_tenant_idx ON public.hrms_super_funds USING btree (tenant_id);


--
-- Name: tenant_module_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_module_unique ON public.hrms_tenant_modules USING btree (tenant_id, module_id);


--
-- Name: timesheets_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX timesheets_employee_idx ON public.hrms_timesheets USING btree (employee_id);


--
-- Name: timesheets_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX timesheets_tenant_idx ON public.hrms_timesheets USING btree (tenant_id);


--
-- Name: toil_balances_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX toil_balances_tenant_idx ON public.hrms_toil_balances USING btree (tenant_id);


--
-- Name: toil_balances_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX toil_balances_unique ON public.hrms_toil_balances USING btree (tenant_id, employee_id);


--
-- Name: toil_entries_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX toil_entries_date_idx ON public.hrms_toil_entries USING btree (work_date);


--
-- Name: toil_entries_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX toil_entries_employee_idx ON public.hrms_toil_entries USING btree (employee_id);


--
-- Name: toil_entries_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX toil_entries_tenant_idx ON public.hrms_toil_entries USING btree (tenant_id);


--
-- Name: users_email_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_tenant ON public.hrms_users USING btree (tenant_id, email);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: idx_objects_current_version; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL);


--
-- Name: idx_objects_null_version; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_name_version_key; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT;


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: idx_hrms_mod_subs_tenant; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_hrms_mod_subs_tenant ON tenant.hrms_module_subscriptions USING btree (tenant_id, is_enabled);


--
-- Name: idx_tenant_module_subscriptions_is_enabled; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_tenant_module_subscriptions_is_enabled ON tenant.module_subscriptions USING btree (is_enabled);


--
-- Name: idx_tenant_module_subscriptions_module_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_tenant_module_subscriptions_module_id ON tenant.module_subscriptions USING btree (module_id);


--
-- Name: idx_tenant_module_subscriptions_tenant_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_tenant_module_subscriptions_tenant_id ON tenant.module_subscriptions USING btree (tenant_id);


--
-- Name: idx_tenant_settings_setting_key; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_tenant_settings_setting_key ON tenant.settings USING btree (setting_key);


--
-- Name: idx_tenant_settings_tenant_id; Type: INDEX; Schema: tenant; Owner: -
--

CREATE INDEX idx_tenant_settings_tenant_id ON tenant.settings USING btree (tenant_id);


--
-- Name: modules trg_catalog_modules_set_updated_at; Type: TRIGGER; Schema: catalog; Owner: -
--

CREATE TRIGGER trg_catalog_modules_set_updated_at BEFORE UPDATE ON catalog.modules FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: super_admin_users trg_iam_super_admin_users_set_updated_at; Type: TRIGGER; Schema: iam; Owner: -
--

CREATE TRIGGER trg_iam_super_admin_users_set_updated_at BEFORE UPDATE ON iam.super_admin_users FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: tenants trg_iam_tenants_set_updated_at; Type: TRIGGER; Schema: iam; Owner: -
--

CREATE TRIGGER trg_iam_tenants_set_updated_at BEFORE UPDATE ON iam.tenants FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: module_subscriptions trg_tenant_module_subscriptions_set_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER trg_tenant_module_subscriptions_set_updated_at BEFORE UPDATE ON tenant.module_subscriptions FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: settings trg_tenant_settings_set_updated_at; Type: TRIGGER; Schema: tenant; Owner: -
--

CREATE TRIGGER trg_tenant_settings_set_updated_at BEFORE UPDATE ON tenant.settings FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: hrms_super_admin_events hrms_super_admin_events_super_admin_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.hrms_super_admin_events
    ADD CONSTRAINT hrms_super_admin_events_super_admin_id_fkey FOREIGN KEY (super_admin_id) REFERENCES iam.hrms_super_admin_users(id) ON DELETE SET NULL;


--
-- Name: super_admin_events super_admin_events_super_admin_id_fkey; Type: FK CONSTRAINT; Schema: audit; Owner: -
--

ALTER TABLE ONLY audit.super_admin_events
    ADD CONSTRAINT super_admin_events_super_admin_id_fkey FOREIGN KEY (super_admin_id) REFERENCES iam.super_admin_users(id) ON DELETE SET NULL;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: hrms_plan_default_modules hrms_plan_default_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.hrms_plan_default_modules
    ADD CONSTRAINT hrms_plan_default_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES catalog.hrms_modules(id) ON DELETE CASCADE;


--
-- Name: plan_default_modules plan_default_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: catalog; Owner: -
--

ALTER TABLE ONLY catalog.plan_default_modules
    ADD CONSTRAINT plan_default_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES catalog.modules(id) ON DELETE CASCADE;


--
-- Name: jobparameter jobparameter_jobid_fkey; Type: FK CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.jobparameter
    ADD CONSTRAINT jobparameter_jobid_fkey FOREIGN KEY (jobid) REFERENCES hangfire.job(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: state state_jobid_fkey; Type: FK CONSTRAINT; Schema: hangfire; Owner: -
--

ALTER TABLE ONLY hangfire.state
    ADD CONSTRAINT state_jobid_fkey FOREIGN KEY (jobid) REFERENCES hangfire.job(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hrms_applications hrms_applications_candidate_id_hrms_candidates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_applications
    ADD CONSTRAINT hrms_applications_candidate_id_hrms_candidates_id_fk FOREIGN KEY (candidate_id) REFERENCES public.hrms_candidates(id);


--
-- Name: hrms_applications hrms_applications_requisition_id_hrms_job_requisitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_applications
    ADD CONSTRAINT hrms_applications_requisition_id_hrms_job_requisitions_id_fk FOREIGN KEY (requisition_id) REFERENCES public.hrms_job_requisitions(id);


--
-- Name: hrms_applications hrms_applications_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_applications
    ADD CONSTRAINT hrms_applications_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_asset_assignments hrms_asset_assignments_asset_id_hrms_assets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_asset_assignments
    ADD CONSTRAINT hrms_asset_assignments_asset_id_hrms_assets_id_fk FOREIGN KEY (asset_id) REFERENCES public.hrms_assets(id);


--
-- Name: hrms_asset_assignments hrms_asset_assignments_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_asset_assignments
    ADD CONSTRAINT hrms_asset_assignments_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_asset_assignments hrms_asset_assignments_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_asset_assignments
    ADD CONSTRAINT hrms_asset_assignments_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_assets hrms_assets_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_assets
    ADD CONSTRAINT hrms_assets_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_audit_logs hrms_audit_logs_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_audit_logs
    ADD CONSTRAINT hrms_audit_logs_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_candidates hrms_candidates_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_candidates
    ADD CONSTRAINT hrms_candidates_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_competencies hrms_competencies_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_competencies
    ADD CONSTRAINT hrms_competencies_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_competency_assessments hrms_competency_assessments_assessor_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_competency_assessments
    ADD CONSTRAINT hrms_competency_assessments_assessor_id_hrms_employees_id_fk FOREIGN KEY (assessor_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_competency_assessments hrms_competency_assessments_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_competency_assessments
    ADD CONSTRAINT hrms_competency_assessments_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_competency_assessments hrms_competency_assessments_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_competency_assessments
    ADD CONSTRAINT hrms_competency_assessments_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_compliance_lock_exceptions hrms_compliance_lock_exceptions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_compliance_lock_exceptions
    ADD CONSTRAINT hrms_compliance_lock_exceptions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_compliance_tracking hrms_compliance_tracking_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_compliance_tracking
    ADD CONSTRAINT hrms_compliance_tracking_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_compliance_tracking hrms_compliance_tracking_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_compliance_tracking
    ADD CONSTRAINT hrms_compliance_tracking_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_contracts hrms_contracts_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_contracts
    ADD CONSTRAINT hrms_contracts_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_contracts hrms_contracts_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_contracts
    ADD CONSTRAINT hrms_contracts_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_courses hrms_courses_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_courses
    ADD CONSTRAINT hrms_courses_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_crm_accounts hrms_crm_accounts_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_accounts
    ADD CONSTRAINT hrms_crm_accounts_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_crm_activities hrms_crm_activities_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_activities
    ADD CONSTRAINT hrms_crm_activities_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_crm_contacts hrms_crm_contacts_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_contacts
    ADD CONSTRAINT hrms_crm_contacts_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_crm_deals hrms_crm_deals_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_deals
    ADD CONSTRAINT hrms_crm_deals_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_crm_leads hrms_crm_leads_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_crm_leads
    ADD CONSTRAINT hrms_crm_leads_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_departments hrms_departments_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_departments
    ADD CONSTRAINT hrms_departments_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_diversity_data hrms_diversity_data_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_diversity_data
    ADD CONSTRAINT hrms_diversity_data_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_diversity_data hrms_diversity_data_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_diversity_data
    ADD CONSTRAINT hrms_diversity_data_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_documents hrms_documents_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_documents
    ADD CONSTRAINT hrms_documents_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_documents hrms_documents_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_documents
    ADD CONSTRAINT hrms_documents_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_emergency_contacts hrms_emergency_contacts_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_emergency_contacts
    ADD CONSTRAINT hrms_emergency_contacts_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_employee_availability hrms_employee_availability_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_availability
    ADD CONSTRAINT hrms_employee_availability_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_employee_availability hrms_employee_availability_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_availability
    ADD CONSTRAINT hrms_employee_availability_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_employee_benefits hrms_employee_benefits_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_benefits
    ADD CONSTRAINT hrms_employee_benefits_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_employee_benefits hrms_employee_benefits_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_benefits
    ADD CONSTRAINT hrms_employee_benefits_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_employee_experience hrms_employee_experience_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_experience
    ADD CONSTRAINT hrms_employee_experience_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_employee_notes hrms_employee_notes_author_id_hrms_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_notes
    ADD CONSTRAINT hrms_employee_notes_author_id_hrms_users_id_fk FOREIGN KEY (author_id) REFERENCES public.hrms_users(id);


--
-- Name: hrms_employee_notes hrms_employee_notes_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_notes
    ADD CONSTRAINT hrms_employee_notes_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_employee_notes hrms_employee_notes_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employee_notes
    ADD CONSTRAINT hrms_employee_notes_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_employees hrms_employees_manager_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employees
    ADD CONSTRAINT hrms_employees_manager_id_hrms_employees_id_fk FOREIGN KEY (manager_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_employees hrms_employees_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employees
    ADD CONSTRAINT hrms_employees_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_employees hrms_employees_user_id_hrms_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_employees
    ADD CONSTRAINT hrms_employees_user_id_hrms_users_id_fk FOREIGN KEY (user_id) REFERENCES public.hrms_users(id);


--
-- Name: hrms_ess_onboarding hrms_ess_onboarding_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ess_onboarding
    ADD CONSTRAINT hrms_ess_onboarding_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_ess_onboarding hrms_ess_onboarding_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ess_onboarding
    ADD CONSTRAINT hrms_ess_onboarding_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_expense_claims hrms_expense_claims_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_expense_claims
    ADD CONSTRAINT hrms_expense_claims_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_expense_claims hrms_expense_claims_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_expense_claims
    ADD CONSTRAINT hrms_expense_claims_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_grievances hrms_grievances_lodged_by_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_grievances
    ADD CONSTRAINT hrms_grievances_lodged_by_hrms_employees_id_fk FOREIGN KEY (lodged_by) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_grievances hrms_grievances_subject_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_grievances
    ADD CONSTRAINT hrms_grievances_subject_id_hrms_employees_id_fk FOREIGN KEY (subject_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_grievances hrms_grievances_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_grievances
    ADD CONSTRAINT hrms_grievances_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_headcount_plan hrms_headcount_plan_department_id_hrms_departments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_headcount_plan
    ADD CONSTRAINT hrms_headcount_plan_department_id_hrms_departments_id_fk FOREIGN KEY (department_id) REFERENCES public.hrms_departments(id);


--
-- Name: hrms_headcount_plan hrms_headcount_plan_position_id_hrms_positions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_headcount_plan
    ADD CONSTRAINT hrms_headcount_plan_position_id_hrms_positions_id_fk FOREIGN KEY (position_id) REFERENCES public.hrms_positions(id);


--
-- Name: hrms_headcount_plan hrms_headcount_plan_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_headcount_plan
    ADD CONSTRAINT hrms_headcount_plan_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_job_requisitions hrms_job_requisitions_position_id_hrms_positions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_job_requisitions
    ADD CONSTRAINT hrms_job_requisitions_position_id_hrms_positions_id_fk FOREIGN KEY (position_id) REFERENCES public.hrms_positions(id);


--
-- Name: hrms_job_requisitions hrms_job_requisitions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_job_requisitions
    ADD CONSTRAINT hrms_job_requisitions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_leave_requests hrms_leave_requests_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_leave_requests
    ADD CONSTRAINT hrms_leave_requests_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_leave_requests hrms_leave_requests_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_leave_requests
    ADD CONSTRAINT hrms_leave_requests_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_ndis_audit_actions hrms_ndis_audit_actions_audit_id_hrms_ndis_audits_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_audit_actions
    ADD CONSTRAINT hrms_ndis_audit_actions_audit_id_hrms_ndis_audits_id_fk FOREIGN KEY (audit_id) REFERENCES public.hrms_ndis_audits(id) ON DELETE CASCADE;


--
-- Name: hrms_ndis_audit_actions hrms_ndis_audit_actions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_audit_actions
    ADD CONSTRAINT hrms_ndis_audit_actions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_ndis_audits hrms_ndis_audits_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_audits
    ADD CONSTRAINT hrms_ndis_audits_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_ndis_incident_actions hrms_ndis_incident_actions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_incident_actions
    ADD CONSTRAINT hrms_ndis_incident_actions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_ndis_incidents hrms_ndis_incidents_participant_id_hrms_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_incidents
    ADD CONSTRAINT hrms_ndis_incidents_participant_id_hrms_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.hrms_participants(id) ON DELETE SET NULL;


--
-- Name: hrms_ndis_incidents hrms_ndis_incidents_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_ndis_incidents
    ADD CONSTRAINT hrms_ndis_incidents_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_notifications hrms_notifications_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_notifications
    ADD CONSTRAINT hrms_notifications_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_notifications hrms_notifications_user_id_hrms_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_notifications
    ADD CONSTRAINT hrms_notifications_user_id_hrms_users_id_fk FOREIGN KEY (user_id) REFERENCES public.hrms_users(id);


--
-- Name: hrms_offer_letter_events hrms_offer_letter_events_offer_id_hrms_offer_letters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letter_events
    ADD CONSTRAINT hrms_offer_letter_events_offer_id_hrms_offer_letters_id_fk FOREIGN KEY (offer_id) REFERENCES public.hrms_offer_letters(id) ON DELETE CASCADE;


--
-- Name: hrms_offer_letter_events hrms_offer_letter_events_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letter_events
    ADD CONSTRAINT hrms_offer_letter_events_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_offer_letter_templates hrms_offer_letter_templates_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letter_templates
    ADD CONSTRAINT hrms_offer_letter_templates_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_offer_letters hrms_offer_letters_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letters
    ADD CONSTRAINT hrms_offer_letters_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_offer_letters hrms_offer_letters_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_offer_letters
    ADD CONSTRAINT hrms_offer_letters_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_onboarding_records hrms_onboarding_records_buddy_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_onboarding_records
    ADD CONSTRAINT hrms_onboarding_records_buddy_id_hrms_employees_id_fk FOREIGN KEY (buddy_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_onboarding_records hrms_onboarding_records_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_onboarding_records
    ADD CONSTRAINT hrms_onboarding_records_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_onboarding_records hrms_onboarding_records_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_onboarding_records
    ADD CONSTRAINT hrms_onboarding_records_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_participant_behaviour_plans hrms_participant_behaviour_plans_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_behaviour_plans
    ADD CONSTRAINT hrms_participant_behaviour_plans_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_contacts hrms_participant_contacts_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_contacts
    ADD CONSTRAINT hrms_participant_contacts_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_goals hrms_participant_goals_participant_id_hrms_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_goals
    ADD CONSTRAINT hrms_participant_goals_participant_id_hrms_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.hrms_participants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_goals hrms_participant_goals_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_goals
    ADD CONSTRAINT hrms_participant_goals_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_health_conditions hrms_participant_health_conditions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_health_conditions
    ADD CONSTRAINT hrms_participant_health_conditions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_incidents hrms_participant_incidents_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_incidents
    ADD CONSTRAINT hrms_participant_incidents_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_medication_logs hrms_participant_medication_logs_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_medication_logs
    ADD CONSTRAINT hrms_participant_medication_logs_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_medications hrms_participant_medications_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_medications
    ADD CONSTRAINT hrms_participant_medications_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_notes hrms_participant_notes_participant_id_hrms_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_notes
    ADD CONSTRAINT hrms_participant_notes_participant_id_hrms_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.hrms_participants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_notes hrms_participant_notes_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_notes
    ADD CONSTRAINT hrms_participant_notes_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participant_support_plans hrms_participant_support_plans_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participant_support_plans
    ADD CONSTRAINT hrms_participant_support_plans_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_participants hrms_participants_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_participants
    ADD CONSTRAINT hrms_participants_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_payroll_records hrms_payroll_records_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_payroll_records
    ADD CONSTRAINT hrms_payroll_records_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_payroll_records hrms_payroll_records_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_payroll_records
    ADD CONSTRAINT hrms_payroll_records_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_payroll_run_entries hrms_payroll_run_entries_run_id_hrms_payroll_runs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_payroll_run_entries
    ADD CONSTRAINT hrms_payroll_run_entries_run_id_hrms_payroll_runs_id_fk FOREIGN KEY (run_id) REFERENCES public.hrms_payroll_runs(id) ON DELETE CASCADE;


--
-- Name: hrms_performance_goals hrms_performance_goals_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_goals
    ADD CONSTRAINT hrms_performance_goals_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_performance_goals hrms_performance_goals_review_id_hrms_performance_reviews_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_goals
    ADD CONSTRAINT hrms_performance_goals_review_id_hrms_performance_reviews_id_fk FOREIGN KEY (review_id) REFERENCES public.hrms_performance_reviews(id) ON DELETE SET NULL;


--
-- Name: hrms_performance_goals hrms_performance_goals_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_goals
    ADD CONSTRAINT hrms_performance_goals_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_performance_reviews hrms_performance_reviews_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_reviews
    ADD CONSTRAINT hrms_performance_reviews_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_performance_reviews hrms_performance_reviews_reviewer_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_reviews
    ADD CONSTRAINT hrms_performance_reviews_reviewer_id_hrms_employees_id_fk FOREIGN KEY (reviewer_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_performance_reviews hrms_performance_reviews_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_performance_reviews
    ADD CONSTRAINT hrms_performance_reviews_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_positions hrms_positions_department_id_hrms_departments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_positions
    ADD CONSTRAINT hrms_positions_department_id_hrms_departments_id_fk FOREIGN KEY (department_id) REFERENCES public.hrms_departments(id);


--
-- Name: hrms_positions hrms_positions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_positions
    ADD CONSTRAINT hrms_positions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_promotion_events hrms_promotion_events_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_promotion_events
    ADD CONSTRAINT hrms_promotion_events_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_promotion_requests hrms_promotion_requests_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_promotion_requests
    ADD CONSTRAINT hrms_promotion_requests_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_promotion_requests hrms_promotion_requests_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_promotion_requests
    ADD CONSTRAINT hrms_promotion_requests_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_public_holidays hrms_public_holidays_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_public_holidays
    ADD CONSTRAINT hrms_public_holidays_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_recognitions hrms_recognitions_nominated_by_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_recognitions
    ADD CONSTRAINT hrms_recognitions_nominated_by_hrms_employees_id_fk FOREIGN KEY (nominated_by) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_recognitions hrms_recognitions_recipient_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_recognitions
    ADD CONSTRAINT hrms_recognitions_recipient_id_hrms_employees_id_fk FOREIGN KEY (recipient_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_recognitions hrms_recognitions_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_recognitions
    ADD CONSTRAINT hrms_recognitions_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_referrals hrms_referrals_referred_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_referrals
    ADD CONSTRAINT hrms_referrals_referred_employee_id_hrms_employees_id_fk FOREIGN KEY (referred_employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_referrals hrms_referrals_referrer_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_referrals
    ADD CONSTRAINT hrms_referrals_referrer_id_hrms_employees_id_fk FOREIGN KEY (referrer_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_referrals hrms_referrals_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_referrals
    ADD CONSTRAINT hrms_referrals_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_roster_template_slots hrms_roster_template_slots_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_roster_template_slots
    ADD CONSTRAINT hrms_roster_template_slots_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_roster_templates hrms_roster_templates_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_roster_templates
    ADD CONSTRAINT hrms_roster_templates_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_screening_records hrms_screening_records_document_id_hrms_documents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_screening_records
    ADD CONSTRAINT hrms_screening_records_document_id_hrms_documents_id_fk FOREIGN KEY (document_id) REFERENCES public.hrms_documents(id);


--
-- Name: hrms_screening_records hrms_screening_records_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_screening_records
    ADD CONSTRAINT hrms_screening_records_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_screening_records hrms_screening_records_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_screening_records
    ADD CONSTRAINT hrms_screening_records_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_separation_events hrms_separation_events_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_separation_events
    ADD CONSTRAINT hrms_separation_events_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_separation_records hrms_separation_records_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_separation_records
    ADD CONSTRAINT hrms_separation_records_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_separation_records hrms_separation_records_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_separation_records
    ADD CONSTRAINT hrms_separation_records_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_shift_swap_requests hrms_shift_swap_requests_requested_by_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shift_swap_requests
    ADD CONSTRAINT hrms_shift_swap_requests_requested_by_id_hrms_employees_id_fk FOREIGN KEY (requested_by_id) REFERENCES public.hrms_employees(id) ON DELETE CASCADE;


--
-- Name: hrms_shift_swap_requests hrms_shift_swap_requests_shift_id_hrms_shifts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shift_swap_requests
    ADD CONSTRAINT hrms_shift_swap_requests_shift_id_hrms_shifts_id_fk FOREIGN KEY (shift_id) REFERENCES public.hrms_shifts(id) ON DELETE CASCADE;


--
-- Name: hrms_shift_swap_requests hrms_shift_swap_requests_swap_with_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shift_swap_requests
    ADD CONSTRAINT hrms_shift_swap_requests_swap_with_id_hrms_employees_id_fk FOREIGN KEY (swap_with_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_shift_swap_requests hrms_shift_swap_requests_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shift_swap_requests
    ADD CONSTRAINT hrms_shift_swap_requests_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_shifts hrms_shifts_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shifts
    ADD CONSTRAINT hrms_shifts_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_shifts hrms_shifts_participant_id_hrms_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shifts
    ADD CONSTRAINT hrms_shifts_participant_id_hrms_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.hrms_participants(id);


--
-- Name: hrms_shifts hrms_shifts_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_shifts
    ADD CONSTRAINT hrms_shifts_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_supervision_records hrms_supervision_records_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_supervision_records
    ADD CONSTRAINT hrms_supervision_records_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_supervision_records hrms_supervision_records_supervisor_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_supervision_records
    ADD CONSTRAINT hrms_supervision_records_supervisor_id_hrms_employees_id_fk FOREIGN KEY (supervisor_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_supervision_records hrms_supervision_records_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_supervision_records
    ADD CONSTRAINT hrms_supervision_records_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_survey_responses hrms_survey_responses_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_survey_responses
    ADD CONSTRAINT hrms_survey_responses_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_survey_responses hrms_survey_responses_survey_id_hrms_surveys_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_survey_responses
    ADD CONSTRAINT hrms_survey_responses_survey_id_hrms_surveys_id_fk FOREIGN KEY (survey_id) REFERENCES public.hrms_surveys(id);


--
-- Name: hrms_survey_responses hrms_survey_responses_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_survey_responses
    ADD CONSTRAINT hrms_survey_responses_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_surveys hrms_surveys_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_surveys
    ADD CONSTRAINT hrms_surveys_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_tenant_modules hrms_tenant_modules_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_tenant_modules
    ADD CONSTRAINT hrms_tenant_modules_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_timesheets hrms_timesheets_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_timesheets
    ADD CONSTRAINT hrms_timesheets_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_timesheets hrms_timesheets_shift_id_hrms_shifts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_timesheets
    ADD CONSTRAINT hrms_timesheets_shift_id_hrms_shifts_id_fk FOREIGN KEY (shift_id) REFERENCES public.hrms_shifts(id);


--
-- Name: hrms_timesheets hrms_timesheets_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_timesheets
    ADD CONSTRAINT hrms_timesheets_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_training_records hrms_training_records_course_id_hrms_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_training_records
    ADD CONSTRAINT hrms_training_records_course_id_hrms_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.hrms_courses(id);


--
-- Name: hrms_training_records hrms_training_records_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_training_records
    ADD CONSTRAINT hrms_training_records_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_training_records hrms_training_records_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_training_records
    ADD CONSTRAINT hrms_training_records_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: hrms_users hrms_users_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_users
    ADD CONSTRAINT hrms_users_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: hrms_whs_incidents hrms_whs_incidents_employee_id_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_whs_incidents
    ADD CONSTRAINT hrms_whs_incidents_employee_id_hrms_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_whs_incidents hrms_whs_incidents_reported_by_hrms_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_whs_incidents
    ADD CONSTRAINT hrms_whs_incidents_reported_by_hrms_employees_id_fk FOREIGN KEY (reported_by) REFERENCES public.hrms_employees(id);


--
-- Name: hrms_whs_incidents hrms_whs_incidents_tenant_id_hrms_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hrms_whs_incidents
    ADD CONSTRAINT hrms_whs_incidents_tenant_id_hrms_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: hrms_module_subscriptions hrms_module_subscriptions_disabled_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.hrms_module_subscriptions
    ADD CONSTRAINT hrms_module_subscriptions_disabled_by_fkey FOREIGN KEY (disabled_by) REFERENCES iam.hrms_super_admin_users(id) ON DELETE SET NULL;


--
-- Name: hrms_module_subscriptions hrms_module_subscriptions_enabled_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.hrms_module_subscriptions
    ADD CONSTRAINT hrms_module_subscriptions_enabled_by_fkey FOREIGN KEY (enabled_by) REFERENCES iam.hrms_super_admin_users(id) ON DELETE SET NULL;


--
-- Name: hrms_module_subscriptions hrms_module_subscriptions_module_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.hrms_module_subscriptions
    ADD CONSTRAINT hrms_module_subscriptions_module_id_fkey FOREIGN KEY (module_id) REFERENCES catalog.hrms_modules(id) ON DELETE CASCADE;


--
-- Name: hrms_module_subscriptions hrms_module_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.hrms_module_subscriptions
    ADD CONSTRAINT hrms_module_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.hrms_tenants(id) ON DELETE CASCADE;


--
-- Name: module_subscriptions module_subscriptions_disabled_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.module_subscriptions
    ADD CONSTRAINT module_subscriptions_disabled_by_fkey FOREIGN KEY (disabled_by) REFERENCES iam.super_admin_users(id) ON DELETE SET NULL;


--
-- Name: module_subscriptions module_subscriptions_enabled_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.module_subscriptions
    ADD CONSTRAINT module_subscriptions_enabled_by_fkey FOREIGN KEY (enabled_by) REFERENCES iam.super_admin_users(id) ON DELETE SET NULL;


--
-- Name: module_subscriptions module_subscriptions_module_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.module_subscriptions
    ADD CONSTRAINT module_subscriptions_module_id_fkey FOREIGN KEY (module_id) REFERENCES catalog.modules(id) ON DELETE CASCADE;


--
-- Name: module_subscriptions module_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.module_subscriptions
    ADD CONSTRAINT module_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES iam.tenants(id) ON DELETE CASCADE;


--
-- Name: settings settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.settings
    ADD CONSTRAINT settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES iam.tenants(id) ON DELETE CASCADE;


--
-- Name: settings settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: tenant; Owner: -
--

ALTER TABLE ONLY tenant.settings
    ADD CONSTRAINT settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES iam.super_admin_users(id) ON DELETE SET NULL;


--
-- Name: hrms_super_admin_events; Type: ROW SECURITY; Schema: audit; Owner: -
--

ALTER TABLE audit.hrms_super_admin_events ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: hrms_modules; Type: ROW SECURITY; Schema: catalog; Owner: -
--

ALTER TABLE catalog.hrms_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: hrms_plan_default_modules; Type: ROW SECURITY; Schema: catalog; Owner: -
--

ALTER TABLE catalog.hrms_plan_default_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: hrms_super_admin_users; Type: ROW SECURITY; Schema: iam; Owner: -
--

ALTER TABLE iam.hrms_super_admin_users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: hrms_module_subscriptions; Type: ROW SECURITY; Schema: tenant; Owner: -
--

ALTER TABLE tenant.hrms_module_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict 2GAlprCMhoyDJ4AweJGkqz3j60IIPe3B6JHLWGgshqyY2ufbnnQAVTczyxF6Rad

