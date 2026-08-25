-- Migration: 0000_initial_setup.sql
-- Sets up pgvector extension and base schema
-- Run BEFORE drizzle-kit migrations

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the ivfflat index for face embeddings (approximate nearest neighbor)
-- This is created manually because drizzle-kit doesn't support ivfflat syntax yet
-- Run AFTER the face_embeddings table is created by drizzle-kit

-- To run after face_embeddings table exists:
-- CREATE INDEX CONCURRENTLY face_embeddings_vector_idx
--   ON face_embeddings
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);
--
-- For HNSW (better recall, more memory):
-- CREATE INDEX CONCURRENTLY face_embeddings_hnsw_idx
--   ON face_embeddings
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- Note: For events with large face counts, consider partitioning face_embeddings by event_id.
-- The query always filters by event_id first which allows partition pruning.
