import { describe, it, expect } from 'vitest';
import { calculateBurnoutRisk } from './burnoutCalculator';
import { MoodEntry, StressLevel, EnergyLevel, PrimaryEmotion } from '@/types';

// Helper to generate a mock entry
const createMockEntry = (overrides: Partial<MoodEntry> = {}): MoodEntry => {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    created_at: new Date().toISOString(),
    mood_score: 7,
    stress_level: 'Low' as StressLevel,
    energy_level: 'High' as EnergyLevel,
    sleep_hours: 8,
    study_hours: 6,
    primary_emotion: 'Calm' as PrimaryEmotion,
    reflection: 'Studying well, feeling balanced.',
    ...overrides,
  };
};

describe('Burnout Risk Calculator', () => {
  it('should return 0 score and Low Risk when entries list is empty', () => {
    const result = calculateBurnoutRisk([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe('Low Risk');
    expect(result.factors).toContain('No check-in history found yet.');
  });

  it('should identify Low Risk for a balanced student profile', () => {
    const entries = [
      createMockEntry({ mood_score: 8, stress_level: 'Low', sleep_hours: 8, study_hours: 6, primary_emotion: 'Calm' }),
      createMockEntry({ mood_score: 7, stress_level: 'Low', sleep_hours: 8.5, study_hours: 5, primary_emotion: 'Happy' }),
      createMockEntry({ mood_score: 9, stress_level: 'Low', sleep_hours: 8, study_hours: 7, primary_emotion: 'Motivated' }),
    ];
    const result = calculateBurnoutRisk(entries);
    expect(result.score).toBeLessThanOrEqual(35);
    expect(result.level).toBe('Low Risk');
  });

  it('should flag Moderate Risk for high study load and sub-optimal sleep', () => {
    const entries = [
      createMockEntry({ mood_score: 6, stress_level: 'Medium', sleep_hours: 6.5, study_hours: 9.5, primary_emotion: 'Neutral' }),
      createMockEntry({ mood_score: 6.5, stress_level: 'Medium', sleep_hours: 6, study_hours: 9, primary_emotion: 'Neutral' }),
      createMockEntry({ mood_score: 5, stress_level: 'Medium', sleep_hours: 5.5, study_hours: 10, primary_emotion: 'Frustrated' }),
    ];
    const result = calculateBurnoutRisk(entries);
    expect(result.score).toBeGreaterThan(35);
    expect(result.score).toBeLessThanOrEqual(70);
    expect(result.level).toBe('Moderate Risk');
    expect(result.factors.some(f => f.includes('study workload') || f.includes('sleep'))).toBe(true);
  });

  it('should flag High Risk for chronic high stress, severe lack of sleep, and extreme study hours', () => {
    const entries = [
      createMockEntry({ mood_score: 3, stress_level: 'High', sleep_hours: 4, study_hours: 13, primary_emotion: 'Burnt Out' }),
      createMockEntry({ mood_score: 2, stress_level: 'High', sleep_hours: 4.5, study_hours: 14, primary_emotion: 'Overwhelmed' }),
      createMockEntry({ mood_score: 2.5, stress_level: 'High', sleep_hours: 4, study_hours: 13.5, primary_emotion: 'Anxious' }),
    ];
    const result = calculateBurnoutRisk(entries);
    expect(result.score).toBeGreaterThan(70);
    expect(result.level).toBe('High Risk');
    expect(result.factors).toContain('Persistent high stress levels reported recently');
    expect(result.factors.some(f => f.includes('low sleep'))).toBe(true);
    expect(result.factors.some(f => f.includes('Excessive study'))).toBe(true);
  });
});
