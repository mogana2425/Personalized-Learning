-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  phone TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student','teacher','parent','admin')),
  parent_email TEXT,
  child_emails TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  avatar TEXT,
  age INT,
  class TEXT DEFAULT 'Grade 10',
  school TEXT,
  subjects TEXT[],
  learning_interests TEXT[],
  learning_goals TEXT[],
  preferred_learning_style TEXT DEFAULT 'visual',
  skill_scores JSONB DEFAULT '{}',
  ai_recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- progress
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  overall_progress INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_active_date TIMESTAMPTZ,
  weekly_hours FLOAT[] DEFAULT '{0,0,0,0,0,0,0}',
  completed_topics_count INT DEFAULT 0,
  quizzes_taken JSONB DEFAULT '[]',
  time_spent_minutes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- learning_paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  current_week INT DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  weeks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  topic TEXT,
  difficulty_level TEXT DEFAULT 'medium',
  is_initial_assessment BOOLEAN DEFAULT FALSE,
  time_limit_minutes INT DEFAULT 15,
  questions JSONB DEFAULT '[]',
  creator_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- answer_sheets
CREATE TABLE IF NOT EXISTS answer_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  file_name TEXT,
  ocr_text TEXT,
  ai_feedback JSONB,
  status TEXT DEFAULT 'processing',
  subject TEXT,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- tutor_chats
CREATE TABLE IF NOT EXISTS tutor_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  subject TEXT DEFAULT 'General',
  tags TEXT[],
  upvotes INT DEFAULT 0,
  upvoted_by UUID[],
  replies JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
