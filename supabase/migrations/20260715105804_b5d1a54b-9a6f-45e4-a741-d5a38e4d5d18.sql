
-- 1) Welcome bonus one-time claim tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_bonus_claimed_at timestamptz;

-- 2) Prevent multiple pending deposits
CREATE OR REPLACE FUNCTION public.prevent_multiple_pending_payments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' AND EXISTS (
    SELECT 1 FROM public.payments
    WHERE user_id = NEW.user_id
      AND status = 'pending'
      AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Your payment request is still pending. Please wait until it has been approved or rejected before submitting another deposit.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_multiple_pending_payments_trg ON public.payments;
CREATE TRIGGER prevent_multiple_pending_payments_trg
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.prevent_multiple_pending_payments();

-- 3) Welcome bonus atomic claim
CREATE OR REPLACE FUNCTION public.claim_welcome_bonus()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_claimed timestamptz;
  v_new numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT welcome_bonus_claimed_at INTO v_claimed
  FROM public.profiles WHERE id = v_uid FOR UPDATE;

  IF v_claimed IS NOT NULL THEN
    RAISE EXCEPTION 'Welcome bonus already claimed';
  END IF;

  UPDATE public.profiles
     SET welcome_bonus_claimed_at = now()
   WHERE id = v_uid;

  INSERT INTO public.wallet_balances (user_id, balance_usd)
  VALUES (v_uid, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallet_balances
     SET balance_usd = balance_usd + 2,
         updated_at  = now()
   WHERE user_id = v_uid
   RETURNING balance_usd INTO v_new;

  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_welcome_bonus() TO authenticated;

-- 4) Admin refund for rejected withdrawals
CREATE OR REPLACE FUNCTION public.refund_withdrawal(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_wd  public.withdrawals%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_wd FROM public.withdrawals WHERE id = p_id FOR UPDATE;
  IF v_wd.id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;
  IF v_wd.status <> 'pending' THEN
    RETURN;
  END IF;

  UPDATE public.withdrawals
     SET status      = 'rejected',
         reviewed_by = v_uid,
         reviewed_at = now(),
         updated_at  = now()
   WHERE id = p_id;

  INSERT INTO public.wallet_balances (user_id, balance_usd)
  VALUES (v_wd.user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallet_balances
     SET balance_usd = balance_usd + v_wd.amount,
         updated_at  = now()
   WHERE user_id = v_wd.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_withdrawal(uuid) TO authenticated;
