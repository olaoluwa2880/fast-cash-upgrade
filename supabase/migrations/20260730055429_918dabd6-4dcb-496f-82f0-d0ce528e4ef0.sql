CREATE TABLE public.withdrawal_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_index integer NOT NULL,
  amount_ngn numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  receipt_url text,
  status public.request_status NOT NULL DEFAULT 'pending',
  consumed boolean NOT NULL DEFAULT false,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_fees TO authenticated;
GRANT ALL ON public.withdrawal_fees TO service_role;

ALTER TABLE public.withdrawal_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_insert_withdrawal_fees" ON public.withdrawal_fees
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_select_withdrawal_fees" ON public.withdrawal_fees
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_update_withdrawal_fees" ON public.withdrawal_fees
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_delete_withdrawal_fees" ON public.withdrawal_fees
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_withdrawal_fees_updated_at
  BEFORE UPDATE ON public.withdrawal_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.consume_withdrawal_fee()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_id
  FROM public.withdrawal_fees
  WHERE user_id = v_uid AND status = 'approved' AND consumed = false
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal fee not paid';
  END IF;

  UPDATE public.withdrawal_fees
     SET consumed = true, updated_at = now()
   WHERE id = v_id;

  RETURN v_id;
END;
$$;