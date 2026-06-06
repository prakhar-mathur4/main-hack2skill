import { MoodEntry, StressLevel } from '@/types';

export interface BurnoutCalculationResult {
  score: number;
  level: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  factors: string[];
  explanation: string;
}

export function calculateBurnoutRisk(recentEntries: MoodEntry[]): BurnoutCalculationResult {
  if (!recentEntries || recentEntries.length === 0) {
    return {
      score: 0,
      level: 'Low Risk',
      factors: ['No check-in history found yet.'],
      explanation: 'Complete your first daily check-in to analyze your burnout risk.',
    };
  }

  let score = 0;
  const factors: string[] = [];
  const count = recentEntries.length;

  // 1. Stress Level Indicator (Max 35 points)
  const highStressCount = recentEntries.filter((e) => e.stress_level === 'High').length;
  const mediumStressCount = recentEntries.filter((e) => e.stress_level === 'Medium').length;
  
  const highStressRatio = highStressCount / count;
  const mediumStressRatio = mediumStressCount / count;

  if (highStressRatio >= 0.6) {
    score += 35;
    factors.push('Persistent high stress levels reported recently');
  } else if (highStressRatio >= 0.2 || (highStressRatio + mediumStressRatio) >= 0.6) {
    score += 20;
    factors.push('Moderate to high stress levels experienced frequently');
  } else if (mediumStressRatio >= 0.4) {
    score += 10;
    factors.push('Mild but noticeable stress buildup');
  }

  // 2. Sleep Hours Indicator (Max 25 points)
  const averageSleep = recentEntries.reduce((sum, e) => sum + Number(e.sleep_hours), 0) / count;
  if (averageSleep < 5) {
    score += 25;
    factors.push(`Severely low sleep average (${averageSleep.toFixed(1)} hrs)`);
  } else if (averageSleep < 6) {
    score += 15;
    factors.push(`Inadequate sleep average (${averageSleep.toFixed(1)} hrs)`);
  } else if (averageSleep < 7) {
    score += 5;
    factors.push(`Sub-optimal sleep average (${averageSleep.toFixed(1)} hrs)`);
  } else if (averageSleep >= 8.5) {
    score -= 5; // Positive buffer
  }

  // 3. Study Hours Indicator (Max 25 points)
  const averageStudy = recentEntries.reduce((sum, e) => sum + Number(e.study_hours), 0) / count;
  if (averageStudy > 12) {
    score += 25;
    factors.push(`Excessive study hours average (${averageStudy.toFixed(1)} hrs) without sufficient recovery`);
  } else if (averageStudy > 10) {
    score += 15;
    factors.push(`High study workload average (${averageStudy.toFixed(1)} hrs)`);
  } else if (averageStudy > 8) {
    score += 5;
    factors.push(`Steady study schedule average (${averageStudy.toFixed(1)} hrs)`);
  }

  // 4. Mood Trend Indicator (Max 20 points)
  const averageMood = recentEntries.reduce((sum, e) => sum + e.mood_score, 0) / count;
  if (averageMood <= 3) {
    score += 20;
    factors.push(`Very low mood rating average (${averageMood.toFixed(1)}/10)`);
  } else if (averageMood <= 5) {
    score += 12;
    factors.push(`Depressed or low mood rating average (${averageMood.toFixed(1)}/10)`);
  } else if (averageMood <= 6.5) {
    score += 5;
    factors.push(`Average mood rating is sub-neutral (${averageMood.toFixed(1)}/10)`);
  } else if (averageMood >= 8.5) {
    score -= 5; // Positive buffer
  }

  // 5. Emotion-based trigger indicators (Capped modifier, Max 15 points)
  const negativeEmotionsCount = recentEntries.filter((e) =>
    ['Overwhelmed', 'Anxious', 'Burnt Out', 'Frustrated', 'Sad'].includes(e.primary_emotion)
  ).length;
  const negativeEmotionRatio = negativeEmotionsCount / count;

  if (negativeEmotionRatio >= 0.6) {
    score += 15;
    factors.push('Frequently feeling overwhelmed, anxious, or burnt out');
  } else if (negativeEmotionRatio >= 0.3) {
    score += 8;
    factors.push('Experiencing negative emotional states regularly');
  }

  // Clamping score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine risk level category
  let level: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
  if (score > 70) {
    level = 'High Risk';
  } else if (score > 35) {
    level = 'Moderate Risk';
  }

  // Generate customized explanation
  let explanation = '';
  if (level === 'High Risk') {
    explanation = `Your current tracker profile indicates a high risk of burnout. This is primarily caused by ${
      factors.length > 0 ? factors.slice(0, 2).join(' and ') : 'cumulative exam pressure'
    }. It is highly recommended that you reduce study hours immediately, prioritize sleep, and take a dedicated rest day.`;
  } else if (level === 'Moderate Risk') {
    explanation = `You are showing moderate signs of study-related exhaustion. Key contributors include ${
      factors.length > 0 ? factors.slice(0, 2).join(' and ') : 'unbalanced study habits'
    }. Small adjustments like the Pomodoro technique and setting a hard stop-study time can prevent you from crossing into high risk.`;
  } else {
    explanation = 'Your wellness indicators are currently balanced. Keep maintaining your sleep and study routine to sustain this healthy rhythm.';
  }

  return {
    score: Math.round(score),
    level,
    factors: factors.length > 0 ? factors : ['No significant risk factors detected.'],
    explanation,
  };
}
