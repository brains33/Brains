-- ── BURSARY STAFF TABLE SETUP ────────────────────────────────────────

-- 1. CREATE THE TABLE
CREATE TABLE IF NOT EXISTS public.bursary_staff (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email             text NOT NULL UNIQUE,
    password_hash     text NOT NULL,
    name              text NOT NULL,
    created_at        timestamptz DEFAULT now(),
    session_token     text,
    session_expires_at timestamptz,
    login_ip          text,
    failed_attempts   int4 DEFAULT 0,
    last_attempt_at   timestamptz,
    locked_until      timestamptz
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.bursary_staff ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES (check BUSA session token)
CREATE POLICY "Bursar can view own record"
ON public.bursary_staff
FOR SELECT
USING (
  session_token IS NOT NULL
  AND session_token = current_setting('request.headers', true)::json->>'x-busa-token'
);

CREATE POLICY "Bursar can update own record"
ON public.bursary_staff
FOR UPDATE
USING (
  session_token IS NOT NULL
  AND session_token = current_setting('request.headers', true)::json->>'x-busa-token'
)
WITH CHECK (
  session_token = current_setting('request.headers', true)::json->>'x-busa-token'
);

-- 4. PASSWORD VERIFICATION FUNCTION
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.verify_busa_password(
    p_id       bigint,
    p_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_hash text;
BEGIN
    SELECT password_hash INTO stored_hash
    FROM public.bursary_staff
    WHERE id = p_id;

    IF stored_hash IS NULL THEN
        RETURN false;
    END IF;

    -- bcrypt comparison using pgcrypto's crypt()
    RETURN stored_hash = crypt(p_password, stored_hash);
END;
$$;

-- 5. INSERT TEST USER (password: Test123456)
INSERT INTO public.bursary_staff (email, password_hash, name)
VALUES (
    'bus@gmail.com',
    crypt('Test123456', gen_salt('bf')),
    'Isah Muhammad'
);

-- ── LOGIN ATTEMPTS TABLE (for IP rate limiting) ──────────────────────

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ip         text NOT NULL,
    success    boolean NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to manage login attempts
CREATE POLICY "Service role can manage login attempts"
ON public.login_attempts
FOR ALL
USING (true)
WITH CHECK (true);