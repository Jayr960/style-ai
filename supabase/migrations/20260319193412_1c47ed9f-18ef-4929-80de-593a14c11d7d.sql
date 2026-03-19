
-- Add outfit_image_url to outfits table
ALTER TABLE public.outfits ADD COLUMN outfit_image_url text;

-- Create weekly_planner table
CREATE TABLE public.weekly_planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_of_week text NOT NULL,
  outfit_id uuid REFERENCES public.outfits(id) ON DELETE SET NULL,
  outfit_data jsonb DEFAULT '{}'::jsonb,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, week_start)
);

ALTER TABLE public.weekly_planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planner" ON public.weekly_planner FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own planner" ON public.weekly_planner FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own planner" ON public.weekly_planner FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own planner" ON public.weekly_planner FOR DELETE USING (auth.uid() = user_id);

-- Create user_style_history table
CREATE TABLE public.user_style_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  outfit_tags text[] DEFAULT '{}',
  style_vibe text,
  colors text[] DEFAULT '{}',
  occasion text,
  outfit_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_style_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own style history" ON public.user_style_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own style history" ON public.user_style_history FOR INSERT WITH CHECK (auth.uid() = user_id);
