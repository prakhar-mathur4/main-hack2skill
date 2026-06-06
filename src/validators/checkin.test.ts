import { describe, it, expect } from 'vitest';
import { DailyCheckInSchema } from './checkin';

describe('Daily Check-in Validator', () => {
  const validCheckIn = {
    mood_score: 8,
    stress_level: 'Low',
    energy_level: 'High',
    sleep_hours: 7.5,
    study_hours: 6,
    primary_emotion: 'Calm',
    reflection: 'Had a productive study day, mock test was fine.',
    triggers: ['Exam pressure', 'Mock test performance'],
  };

  it('should pass validation with a standard valid check-in', () => {
    const result = DailyCheckInSchema.safeParse(validCheckIn);
    expect(result.success).toBe(true);
  });

  it('should pass validation when optional reflection is empty', () => {
    const checkInNoReflection = { ...validCheckIn, reflection: '' };
    const result = DailyCheckInSchema.safeParse(checkInNoReflection);
    expect(result.success).toBe(true);
  });

  it('should fail validation when mood score is outside 1-10', () => {
    const invalidMoodLow = { ...validCheckIn, mood_score: 0 };
    const invalidMoodHigh = { ...validCheckIn, mood_score: 11 };

    expect(DailyCheckInSchema.safeParse(invalidMoodLow).success).toBe(false);
    expect(DailyCheckInSchema.safeParse(invalidMoodHigh).success).toBe(false);
  });

  it('should fail validation when sleep hours are negative or exceed 24', () => {
    const invalidSleepNegative = { ...validCheckIn, sleep_hours: -1 };
    const invalidSleepExcess = { ...validCheckIn, sleep_hours: 24.5 };

    expect(DailyCheckInSchema.safeParse(invalidSleepNegative).success).toBe(false);
    expect(DailyCheckInSchema.safeParse(invalidSleepExcess).success).toBe(false);
  });

  it('should fail validation when study hours are negative or exceed 24', () => {
    const invalidStudyNegative = { ...validCheckIn, study_hours: -0.5 };
    const invalidStudyExcess = { ...validCheckIn, study_hours: 25 };

    expect(DailyCheckInSchema.safeParse(invalidStudyNegative).success).toBe(false);
    expect(DailyCheckInSchema.safeParse(invalidStudyExcess).success).toBe(false);
  });

  it('should fail validation when stress_level is an invalid string', () => {
    const invalidStress = { ...validCheckIn, stress_level: 'Exhausted' };
    expect(DailyCheckInSchema.safeParse(invalidStress).success).toBe(false);
  });

  it('should fail validation when primary_emotion is not in the allowed list', () => {
    const invalidEmotion = { ...validCheckIn, primary_emotion: 'Excited' };
    expect(DailyCheckInSchema.safeParse(invalidEmotion).success).toBe(false);
  });
});
