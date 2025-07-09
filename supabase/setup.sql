-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create the feedback table with all enhanced fields
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  category TEXT DEFAULT 'general',
  sentiment_score DECIMAL(3,2) DEFAULT 0.5,
  sentiment_label TEXT DEFAULT 'neutral',
  topics TEXT[] DEFAULT '{}',
  feedback_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ai_category_confidence DECIMAL(3,2),
  ai_classification_meta JSONB,
  classification_history JSONB DEFAULT '[]',
  manual_override BOOLEAN DEFAULT FALSE,
  -- Enhanced feedback management fields
  status TEXT DEFAULT 'new', -- new, in_review, resolved, archived
  priority TEXT DEFAULT 'medium', -- high, medium, low
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  edit_history JSONB DEFAULT '[]',
  last_edited_by UUID,
  last_edited_at TIMESTAMP WITH TIME ZONE
);

-- Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create the feedback_notes table
CREATE TABLE IF NOT EXISTS public.feedback_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create the activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view own feedback notes" ON public.feedback_notes;
DROP POLICY IF EXISTS "Users can insert own feedback notes" ON public.feedback_notes;
DROP POLICY IF EXISTS "Users can update own feedback notes" ON public.feedback_notes;
DROP POLICY IF EXISTS "Users can delete own feedback notes" ON public.feedback_notes;
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON public.feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for feedback_notes
CREATE POLICY "Users can view own feedback notes" ON public.feedback_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback notes" ON public.feedback_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback notes" ON public.feedback_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback notes" ON public.feedback_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activity_logs
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS feedback_sentiment_label_idx ON public.feedback(sentiment_label);
CREATE INDEX IF NOT EXISTS feedback_category_idx ON public.feedback(category);
CREATE INDEX IF NOT EXISTS feedback_date_idx ON public.feedback(feedback_date);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback(status);
CREATE INDEX IF NOT EXISTS feedback_priority_idx ON public.feedback(priority);
CREATE INDEX IF NOT EXISTS feedback_is_archived_idx ON public.feedback(is_archived);

CREATE INDEX IF NOT EXISTS feedback_notes_feedback_id_idx ON public.feedback_notes(feedback_id);
CREATE INDEX IF NOT EXISTS feedback_notes_user_id_idx ON public.feedback_notes(user_id);
CREATE INDEX IF NOT EXISTS feedback_notes_created_at_idx ON public.feedback_notes(created_at);

CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_feedback_updated_at ON public.feedback;
CREATE TRIGGER handle_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_feedback_notes_updated_at ON public.feedback_notes;
CREATE TRIGGER handle_feedback_notes_updated_at
  BEFORE UPDATE ON public.feedback_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, is_default)
  VALUES 
    (user_uuid, 'general', '#6B7280', true),
    (user_uuid, 'product', '#3B82F6', true),
    (user_uuid, 'service', '#10B981', true),
    (user_uuid, 'pricing', '#F59E0B', true),
    (user_uuid, 'delivery', '#EF4444', true),
    (user_uuid, 'support', '#8B5CF6', true),
    (user_uuid, 'feature', '#06B6D4', true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user creation function to also create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  -- Create default categories for the new user
  PERFORM public.create_default_categories_for_user(NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create export_history table for tracking exports
CREATE TABLE IF NOT EXISTS public.export_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL,
  configuration JSONB DEFAULT '{}',
  file_path TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  file_size INTEGER,
  record_count INTEGER,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Create export_templates table for saving export configurations
CREATE TABLE IF NOT EXISTS public.export_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB DEFAULT '{}',
  is_shared BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  usage_count INTEGER DEFAULT 0
);

-- Create export_progress table for real-time progress tracking
CREATE TABLE IF NOT EXISTS public.export_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  export_id UUID REFERENCES public.export_history(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  estimated_completion TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security for export tables
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing export policies if they exist
DROP POLICY IF EXISTS "Users can view own export history" ON public.export_history;
DROP POLICY IF EXISTS "Users can insert own export history" ON public.export_history;
DROP POLICY IF EXISTS "Users can update own export history" ON public.export_history;
DROP POLICY IF EXISTS "Users can delete own export history" ON public.export_history;
DROP POLICY IF EXISTS "Users can view own export templates" ON public.export_templates;
DROP POLICY IF EXISTS "Users can view shared export templates" ON public.export_templates;
DROP POLICY IF EXISTS "Users can insert own export templates" ON public.export_templates;
DROP POLICY IF EXISTS "Users can update own export templates" ON public.export_templates;
DROP POLICY IF EXISTS "Users can delete own export templates" ON public.export_templates;
DROP POLICY IF EXISTS "Users can view export progress for own exports" ON public.export_progress;
DROP POLICY IF EXISTS "Users can insert export progress for own exports" ON public.export_progress;
DROP POLICY IF EXISTS "Users can update export progress for own exports" ON public.export_progress;

-- Create RLS policies for export_history
CREATE POLICY "Users can view own export history" ON public.export_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export history" ON public.export_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own export history" ON public.export_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own export history" ON public.export_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for export_templates
CREATE POLICY "Users can view own export templates" ON public.export_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared export templates" ON public.export_templates
  FOR SELECT USING (is_shared = true);

CREATE POLICY "Users can insert own export templates" ON public.export_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own export templates" ON public.export_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own export templates" ON public.export_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for export_progress
CREATE POLICY "Users can view export progress for own exports" ON public.export_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.export_history
      WHERE export_history.id = export_progress.export_id
      AND export_history.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert export progress for own exports" ON public.export_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.export_history
      WHERE export_history.id = export_progress.export_id
      AND export_history.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update export progress for own exports" ON public.export_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.export_history
      WHERE export_history.id = export_progress.export_id
      AND export_history.user_id = auth.uid()
    )
  );

-- Create indexes for export tables
CREATE INDEX IF NOT EXISTS export_history_user_id_idx ON public.export_history(user_id);
CREATE INDEX IF NOT EXISTS export_history_status_idx ON public.export_history(status);
CREATE INDEX IF NOT EXISTS export_history_created_at_idx ON public.export_history(created_at);
CREATE INDEX IF NOT EXISTS export_history_export_type_idx ON public.export_history(export_type);

CREATE INDEX IF NOT EXISTS export_templates_user_id_idx ON public.export_templates(user_id);
CREATE INDEX IF NOT EXISTS export_templates_is_shared_idx ON public.export_templates(is_shared);
CREATE INDEX IF NOT EXISTS export_templates_is_default_idx ON public.export_templates(is_default);
CREATE INDEX IF NOT EXISTS export_templates_created_at_idx ON public.export_templates(created_at);

CREATE INDEX IF NOT EXISTS export_progress_export_id_idx ON public.export_progress(export_id);
CREATE INDEX IF NOT EXISTS export_progress_stage_idx ON public.export_progress(stage);
CREATE INDEX IF NOT EXISTS export_progress_updated_at_idx ON public.export_progress(updated_at);

-- Add triggers for updated_at on export tables
DROP TRIGGER IF EXISTS handle_export_templates_updated_at ON public.export_templates;
CREATE TRIGGER handle_export_templates_updated_at
  BEFORE UPDATE ON public.export_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_export_progress_updated_at ON public.export_progress;
CREATE TRIGGER handle_export_progress_updated_at
  BEFORE UPDATE ON public.export_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to get export analytics for a user
CREATE OR REPLACE FUNCTION public.get_export_analytics(user_uuid UUID)
RETURNS TABLE (
  total_exports BIGINT,
  successful_exports BIGINT,
  failed_exports BIGINT,
  avg_file_size NUMERIC,
  total_records_exported BIGINT,
  most_used_export_type TEXT,
  exports_this_month BIGINT,
  exports_last_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_exports,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_exports,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_exports,
    AVG(file_size)::NUMERIC as avg_file_size,
    COALESCE(SUM(record_count), 0) as total_records_exported,
    MODE() WITHIN GROUP (ORDER BY export_type) as most_used_export_type,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as exports_this_month,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - interval '1 month')
                     AND created_at < date_trunc('month', CURRENT_DATE)) as exports_last_month
  FROM public.export_history
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;