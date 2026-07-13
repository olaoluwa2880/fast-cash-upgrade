
-- BANK DETAILS
CREATE TABLE public.bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bank_details TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_details TO authenticated;
GRANT ALL ON public.bank_details TO service_role;
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read enabled bank_details" ON public.bank_details FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage bank_details" ON public.bank_details FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_bank_details_updated BEFORE UPDATE ON public.bank_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CRYPTO WALLETS
CREATE TABLE public.crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  network text NOT NULL,
  address text NOT NULL,
  label text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crypto_wallets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crypto_wallets TO authenticated;
GRANT ALL ON public.crypto_wallets TO service_role;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read enabled crypto_wallets" ON public.crypto_wallets FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage crypto_wallets" ON public.crypto_wallets FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_crypto_wallets_updated BEFORE UPDATE ON public.crypto_wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SUPPORT SETTINGS
CREATE TABLE public.support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.support_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_settings TO authenticated;
GRANT ALL ON public.support_settings TO service_role;
ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read enabled support_settings" ON public.support_settings FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage support_settings" ON public.support_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_support_settings_updated BEFORE UPDATE ON public.support_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COMMUNITY LINKS
CREATE TABLE public.community_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  platform text NOT NULL DEFAULT 'telegram',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_links TO authenticated;
GRANT ALL ON public.community_links TO service_role;
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read enabled community_links" ON public.community_links FOR SELECT USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage community_links" ON public.community_links FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_community_links_updated BEFORE UPDATE ON public.community_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
