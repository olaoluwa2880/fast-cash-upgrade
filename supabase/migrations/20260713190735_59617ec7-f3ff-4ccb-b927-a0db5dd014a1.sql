
CREATE TABLE public.mining_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount_usd NUMERIC NOT NULL,
  plan_index INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mining_claims TO authenticated;
GRANT ALL ON public.mining_claims TO service_role;
ALTER TABLE public.mining_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own claims" ON public.mining_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own claims" ON public.mining_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all claims" ON public.mining_claims FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX mining_claims_user_created_idx ON public.mining_claims (user_id, created_at DESC);
