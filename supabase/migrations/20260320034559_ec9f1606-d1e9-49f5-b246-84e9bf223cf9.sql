CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  full_name text,
  user_type text DEFAULT 'student',
  custom_user_id text,
  accepted_terms boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_otp_codes_email_code ON public.otp_codes (email, code);

CREATE POLICY "Service role only" ON public.otp_codes
  FOR ALL USING (false);