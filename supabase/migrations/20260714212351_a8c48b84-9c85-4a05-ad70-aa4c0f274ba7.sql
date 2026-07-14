
-- 1. Auto-create wallet row on new profile (covers new signups going forward).
CREATE OR REPLACE FUNCTION public.create_wallet_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet_balances (user_id, balance_usd)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_wallet_after_profile ON public.profiles;
CREATE TRIGGER create_wallet_after_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_profile();

-- 2. Backfill wallet rows for any existing profile that doesn't have one.
INSERT INTO public.wallet_balances (user_id, balance_usd)
SELECT p.id, 0
FROM public.profiles p
LEFT JOIN public.wallet_balances w ON w.user_id = p.id
WHERE w.user_id IS NULL;

-- 3. updated_at auto-touch
DROP TRIGGER IF EXISTS wallet_balances_updated_at ON public.wallet_balances;
CREATE TRIGGER wallet_balances_updated_at
BEFORE UPDATE ON public.wallet_balances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Atomic, security-definer wallet adjustment.
--    Any caller acting as an authenticated user can only modify their OWN row.
--    Returns the new balance. Prevents negative balances.
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(p_delta numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_new numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.wallet_balances (user_id, balance_usd)
  VALUES (v_uid, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallet_balances
     SET balance_usd = balance_usd + p_delta,
         updated_at  = now()
   WHERE user_id = v_uid
   RETURNING balance_usd INTO v_new;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_wallet_balance(numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.adjust_wallet_balance(numeric) TO authenticated;

-- 5. Ensure realtime is publishing wallet_balances (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallet_balances'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_balances';
  END IF;
END $$;

ALTER TABLE public.wallet_balances REPLICA IDENTITY FULL;
