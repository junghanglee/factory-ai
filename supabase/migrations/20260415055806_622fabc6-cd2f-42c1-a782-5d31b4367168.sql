-- Allow authenticated users (sellers) to upload to portfolio-files bucket
CREATE POLICY "Sellers can upload portfolio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio-files');

-- Allow authenticated users to delete their own uploads from portfolio-files
CREATE POLICY "Sellers can delete own portfolio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own uploads in portfolio-files
CREATE POLICY "Sellers can update portfolio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'portfolio-files');