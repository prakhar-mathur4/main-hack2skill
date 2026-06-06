import { z } from 'zod';

export const StressLevelSchema = z.enum(['Low', 'Medium', 'High']);
export const EnergyLevelSchema = z.enum(['Low', 'Medium', 'High']);

export const PrimaryEmotionSchema = z.enum([
  'Happy',
  'Calm',
  'Motivated',
  'Neutral',
  'Overwhelmed',
  'Anxious',
  'Burnt Out',
  'Frustrated',
  'Sad',
]);

export const StressTriggerTypeSchema = z.enum([
  'Exam pressure',
  'Mock test performance',
  'Parental expectations',
  'Lack of preparation',
  'Social comparison',
  'Results anxiety',
  'Time management',
  'Health issues',
  'Financial concerns',
  'Other',
]);

export const DailyCheckInSchema = z.object({
  mood_score: z
    .number()
    .min(1, 'Mood score must be at least 1')
    .max(10, 'Mood score cannot exceed 10'),
  stress_level: StressLevelSchema,
  energy_level: EnergyLevelSchema,
  sleep_hours: z
    .number()
    .min(0, 'Sleep hours cannot be negative')
    .max(24, 'Sleep hours cannot exceed 24'),
  study_hours: z
    .number()
    .min(0, 'Study hours cannot be negative')
    .max(24, 'Study hours cannot exceed 24'),
  primary_emotion: PrimaryEmotionSchema,
  reflection: z
    .string()
    .max(5000, 'Reflection details are too long (maximum 5000 characters)')
    .optional()
    .or(z.literal('')),
  triggers: z.array(StressTriggerTypeSchema).default([]),
});

export const JournalSubmissionSchema = z.object({
  content: z
    .string()
    .min(1, 'Journal entry cannot be empty')
    .max(10000, 'Journal entry is too long (maximum 10000 characters)'),
});
