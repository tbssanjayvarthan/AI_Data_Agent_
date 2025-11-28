import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadedFile {
  id: string;
  user_id: string;
  original_filename: string;
  file_size: number;
  storage_path: string;
  sheet_names: string[];
  column_mapping: Record<string, string>;
  row_count: number;
  data_preview: unknown[];
  data_quality_issues: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  file_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  query_metadata: Record<string, unknown>;
  visualization_data: Record<string, unknown>;
  created_at: string;
}