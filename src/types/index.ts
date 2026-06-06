export type StressLevel = 'Low' | 'Medium' | 'High';
export type EnergyLevel = 'Low' | 'Medium' | 'High';

export type PrimaryEmotion =
  | 'Happy'
  | 'Calm'
  | 'Motivated'
  | 'Neutral'
  | 'Overwhelmed'
  | 'Anxious'
  | 'Burnt Out'
  | 'Frustrated'
  | 'Sad';

export type StressTriggerType =
  | 'Exam pressure'
  | 'Mock test performance'
  | 'Parental expectations'
  | 'Lack of preparation'
  | 'Social comparison'
  | 'Results anxiety'
  | 'Time management'
  | 'Health issues'
  | 'Financial concerns'
  | 'Other';

export interface MoodEntry {
  id: string;
  user_id: string;
  created_at: string;
  mood_score: number;
  stress_level: StressLevel;
  energy_level: EnergyLevel;
  sleep_hours: number;
  study_hours: number;
  primary_emotion: PrimaryEmotion;
  reflection?: string;
}

export interface StressTrigger {
  id: string;
  user_id: string;
  mood_entry_id?: string;
  created_at: string;
  trigger_name: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  content: string;
  sentiment_score?: number;
  ai_summary?: string;
}

export interface WellnessRecommendations {
  study: string[];
  mental: string[];
  physical: string[];
  sleep: string[];
}

export interface AiInsight {
  id: string;
  user_id: string;
  created_at: string;
  burnout_score: number;
  burnout_level: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  recommendation: WellnessRecommendations;
  insight: string;
}

export interface CheckInInput {
  mood_score: number;
  stress_level: StressLevel;
  energy_level: EnergyLevel;
  sleep_hours: number;
  study_hours: number;
  primary_emotion: PrimaryEmotion;
  reflection: string;
  triggers: StressTriggerType[];
}

export interface AiAnalysisOutput {
  summary: string;
  sentiment: string;
  burnoutScoreModifier: number;
  riskExplanation: string;
  contributingFactors: string[];
  recommendations: WellnessRecommendations;
  encouragement: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
