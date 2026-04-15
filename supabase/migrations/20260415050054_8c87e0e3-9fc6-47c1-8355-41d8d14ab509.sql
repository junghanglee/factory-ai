
-- Create storage bucket for seller documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-documents', 'seller-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view seller documents
CREATE POLICY "Seller documents publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'seller-documents');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload seller documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own files
CREATE POLICY "Users can update own seller documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own seller documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'seller-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
