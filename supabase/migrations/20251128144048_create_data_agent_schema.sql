/*
  # AI Data Agent Platform Schema

  ## Overview
  This migration sets up the complete database schema for an AI-powered conversational data analysis platform.
  
  ## New Tables
  
  ### 1. `uploaded_files`
  Stores metadata about uploaded Excel files
  - `id` (uuid, primary key) - Unique identifier for each file
  - `user_id` (uuid) - Reference to authenticated user
  - `original_filename` (text) - Original name of the uploaded file
  - `file_size` (bigint) - Size of file in bytes
  - `storage_path` (text) - Path to file in storage
  - `sheet_names` (jsonb) - Array of sheet names in the Excel file
  - `column_mapping` (jsonb) - Cleaned column names and data types
  - `row_count` (integer) - Number of rows in the dataset
  - `data_preview` (jsonb) - First 10 rows for quick preview
  - `data_quality_issues` (jsonb) - Array of detected data quality issues
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `conversations`
  Tracks user conversations/sessions
  - `id` (uuid, primary key) - Unique conversation identifier
  - `user_id` (uuid) - Reference to authenticated user
  - `file_id` (uuid) - Reference to the uploaded file being analyzed
  - `title` (text) - Auto-generated conversation title
  - `created_at` (timestamptz) - Conversation start time
  - `updated_at` (timestamptz) - Last message timestamp

  ### 3. `messages`
  Stores individual messages in conversations
  - `id` (uuid, primary key) - Unique message identifier
  - `conversation_id` (uuid) - Reference to parent conversation
  - `role` (text) - Either 'user' or 'assistant'
  - `content` (text) - The message text
  - `query_metadata` (jsonb) - SQL query, execution time, etc.
  - `visualization_data` (jsonb) - Chart configurations and data
  - `created_at` (timestamptz) - Message timestamp

  ### 4. `data_cache`
  Caches processed data and query results
  - `id` (uuid, primary key) - Cache entry identifier
  - `file_id` (uuid) - Reference to source file
  - `cache_key` (text) - Unique key for cache lookup
  - `data` (jsonb) - Cached data
  - `created_at` (timestamptz) - Cache creation time
  - `expires_at` (timestamptz) - Cache expiration time

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Users can only access their own data
  - Policies enforce authentication and ownership checks
  
  ### Policies
  - SELECT: Users can view their own records
  - INSERT: Users can create records for themselves
  - UPDATE: Users can update their own records
  - DELETE: Users can delete their own records

  ## Indexes
  - Performance indexes on frequently queried columns
  - Foreign key relationships for data integrity
*/

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  sheet_names jsonb DEFAULT '[]'::jsonb,
  column_mapping jsonb DEFAULT '{}'::jsonb,
  row_count integer DEFAULT 0,
  data_preview jsonb DEFAULT '[]'::jsonb,
  data_quality_issues jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_id uuid NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  query_metadata jsonb DEFAULT '{}'::jsonb,
  visualization_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create data_cache table
CREATE TABLE IF NOT EXISTS data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '1 hour'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_file_id ON conversations(file_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_data_cache_file_id ON data_cache(file_id);
CREATE INDEX IF NOT EXISTS idx_data_cache_cache_key ON data_cache(cache_key);

-- Enable Row Level Security
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view own files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON uploaded_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON uploaded_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for data_cache
CREATE POLICY "Users can view cache for own files"
  ON data_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_files
      WHERE uploaded_files.id = data_cache.file_id
      AND uploaded_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cache for own files"
  ON data_cache FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_files
      WHERE uploaded_files.id = data_cache.file_id
      AND uploaded_files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cache for own files"
  ON data_cache FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_files
      WHERE uploaded_files.id = data_cache.file_id
      AND uploaded_files.user_id = auth.uid()
    )
  );