
export interface AIEducationContentRequest {
  contentType: 'lesson' | 'quiz' | 'game' | 'buddy';
  subject?: string;
  topic?: string;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
  questionCount?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  gameType?: 'puzzle' | 'matching' | 'adventure' | 'quiz';
  question?: string;
  studentName?: string;
  language?: 'en' | 'id';
  studentId?: string;
  includeImages?: boolean;
  skipMediaSearch?: boolean;
}

export interface AIEducationContentResponse {
  content: any;
  error?: string;
}

export interface LessonMetadata {
  id: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  createdAt: string;
  updatedAt?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
}

export interface LessonContent {
  title: string;
  introduction: string;
  mainContent: LessonSection[];
  funFacts?: string[];
  activity?: {
    title: string;
    instructions: string;
    image?: {
      url: string;
      alt: string;
      caption?: string;
    };
  };
  conclusion: string;
  summary: string;
  references?: LessonReference[];
}

export interface LessonSection {
  heading: string;
  text: string;
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
}

export interface LessonReference {
  title: string;
  author?: string;
  year?: string;
  url?: string;
  publicationName?: string;
}

export interface LessonVideoData {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  description?: string;
}

export interface QuizMetadata {
  id: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  createdAt: string;
  updatedAt?: string;
  questionCount: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  image?: {
    url: string;
    alt: string;
  };
  userAnswer?: number;
  isCorrect?: boolean;
}

export interface GameMetadata {
  id: string;
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  createdAt: string;
  updatedAt?: string;
  gameType: 'puzzle' | 'matching' | 'adventure' | 'quiz';
}

export interface LearningActivityRecord {
  id?: string;
  student_id: string;
  activity_type: 'lesson' | 'quiz' | 'game' | 'video' | 'practice';
  subject: string;
  topic: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  completed: boolean;
  score?: number;
  duration_seconds?: number;
  metadata?: any;
}

export interface StudentProgressSummary {
  student_id: string;
  total_activities: number;
  completed_activities: number;
  average_score: number;
  total_duration_minutes: number;
  subjects: {
    [subject: string]: {
      progress: number;
      activity_count: number;
      completed_count: number;
      average_score: number;
    };
  };
  last_activity_at?: string;
  achievements?: {
    badges_earned: number;
    streak_days: number;
    level: number;
  };
}

export interface LearningContentWrapperProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReset: () => void;
  onQuizComplete?: (score: number) => void;
  recommendationId?: string;
}
