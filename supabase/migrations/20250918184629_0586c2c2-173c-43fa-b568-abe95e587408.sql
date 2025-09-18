-- Create RLS policies for the pics storage bucket

-- Policy to allow anyone to upload files to the pics bucket
CREATE POLICY "Anyone can upload to pics bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pics');

-- Policy to allow public read access to pics bucket
CREATE POLICY "Public read access to pics bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pics');

-- Policy to allow anyone to update files in pics bucket
CREATE POLICY "Anyone can update pics bucket files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pics')
WITH CHECK (bucket_id = 'pics');

-- Policy to allow anyone to delete files from pics bucket  
CREATE POLICY "Anyone can delete from pics bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pics');