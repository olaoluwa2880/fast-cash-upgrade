
CREATE POLICY "users upload own receipts" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "users read own receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
