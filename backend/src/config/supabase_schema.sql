-- SQL Table schema for storing Mongoose fallback documents in Supabase
-- Run this in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS plis_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection TEXT NOT NULL,
    doc_id TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (collection, doc_id)
);

-- Index for fast queries by collection and doc_id
CREATE INDEX IF NOT EXISTS idx_plis_documents_collection_doc_id 
ON plis_documents (collection, doc_id);
