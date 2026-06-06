'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DailyCheckInSchema } from '@/validators/checkin';
import { useWellness } from '../layout/WellnessProvider';
import { PrimaryEmotion, StressTriggerType, StressLevel, EnergyLevel } from '@/types';
import { ShieldAlert, Smile, Zap, Frown, CheckCircle } from 'lucide-react';

interface DailyCheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMOTIONS: { value: PrimaryEmotion; label: string; icon: string }[] = [
  { value: 'Happy', label: 'Happy', icon: '😊' },
  { value: 'Calm', label: 'Calm', icon: '😌' },
  { value: 'Motivated', label: 'Motivated', icon: '💪' },
  { value: 'Neutral', label: 'Neutral', icon: '😐' },
  { value: 'Overwhelmed', label: 'Overwhelmed', icon: '🤯' },
  { value: 'Anxious', label: 'Anxious', icon: '😰' },
  { value: 'Burnt Out', label: 'Burnt Out', icon: '🔋' },
  { value: 'Frustrated', label: 'Frustrated', icon: '😤' },
  { value: 'Sad', label: 'Sad', icon: '😢' },
];

const TRIGGERS: StressTriggerType[] = [
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
];

export function DailyCheckInDialog({ isOpen, onClose, onSuccess }: DailyCheckInDialogProps) {
  const { userId, geminiKey } = useWellness();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(DailyCheckInSchema),
    defaultValues: {
      mood_score: 5,
      stress_level: 'Medium' as StressLevel,
      energy_level: 'Medium' as EnergyLevel,
      sleep_hours: 7,
      study_hours: 6,
      primary_emotion: 'Neutral' as PrimaryEmotion,
      reflection: '',
      triggers: [] as StressTriggerType[],
    },
  });

  const selectedEmotion = watch('primary_emotion');
  const selectedTriggers = watch('triggers');
  const moodScore = watch('mood_score');
  const stressLevel = watch('stress_level');
  const energyLevel = watch('energy_level');

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey || '',
        },
        body: JSON.stringify({
          ...data,
          user_id: userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit check-in.');
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTrigger = (trigger: StressTriggerType) => {
    const current = [...(selectedTriggers || [])];
    const index = current.indexOf(trigger);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(trigger);
    }
    setValue('triggers', current);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md px-6 py-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 id="checkin-title" className="text-xl font-bold text-card-foreground">
              Daily Wellness Check-In
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">How is your preparation going today?</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 flex gap-2 text-sm text-destructive font-medium">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Mood Score: 1-10 Scale */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="mood-slider" className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                <Smile className="h-4.5 w-4.5 text-primary" />
                Mood Score (1-10)
              </label>
              <span className="text-lg font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {moodScore}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">1 indicates very low/distressed; 10 indicates calm, focused, and happy.</p>
            <Controller
              name="mood_score"
              control={control}
              render={({ field }) => (
                <input
                  id="mood-slider"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                />
              )}
            />
          </div>

          {/* 2. Stress & Energy Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Stress level */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-card-foreground block">Stress Level</label>
              <div className="flex gap-2" role="radiogroup" aria-label="Stress Level">
                {(['Low', 'Medium', 'High'] as StressLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setValue('stress_level', level)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      stressLevel === level
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background hover:bg-muted border-border/80 text-muted-foreground'
                    }`}
                    role="radio"
                    aria-checked={stressLevel === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy level */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-card-foreground flex items-center gap-1">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500/10" />
                Energy Level
              </label>
              <div className="flex gap-2" role="radiogroup" aria-label="Energy Level">
                {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setValue('energy_level', level)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      energyLevel === level
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background hover:bg-muted border-border/80 text-muted-foreground'
                    }`}
                    role="radio"
                    aria-checked={energyLevel === level}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Sleep & Study Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Sleep Hours */}
            <div className="space-y-2">
              <label htmlFor="sleep-hours-input" className="text-sm font-semibold text-card-foreground block">
                Sleep Hours (Last Night)
              </label>
              <input
                id="sleep-hours-input"
                type="number"
                step="0.5"
                {...register('sleep_hours', { valueAsNumber: true })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g. 7.5"
              />
              {errors.sleep_hours && (
                <p className="text-xs text-destructive font-medium">{errors.sleep_hours.message}</p>
              )}
            </div>

            {/* Study Hours */}
            <div className="space-y-2">
              <label htmlFor="study-hours-input" className="text-sm font-semibold text-card-foreground block">
                Study Hours (Today)
              </label>
              <input
                id="study-hours-input"
                type="number"
                step="0.5"
                {...register('study_hours', { valueAsNumber: true })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g. 8"
              />
              {errors.study_hours && (
                <p className="text-xs text-destructive font-medium">{errors.study_hours.message}</p>
              )}
            </div>
          </div>

          {/* 4. Primary Emotion */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-card-foreground block">Primary Emotion Today</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Primary Emotion">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.value}
                  type="button"
                  onClick={() => setValue('primary_emotion', emotion.value)}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    selectedEmotion === emotion.value
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-background hover:bg-muted border-border/80 text-muted-foreground'
                  }`}
                  role="radio"
                  aria-checked={selectedEmotion === emotion.value}
                >
                  <span className="text-xl" aria-hidden="true">{emotion.icon}</span>
                  <span className="text-[10px] font-medium tracking-tight text-center">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Stress Triggers Selection */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-card-foreground block">
              What is contributing to your stress today?
            </label>
            <p className="text-xs text-muted-foreground">Select all options that apply:</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Stress Triggers">
              {TRIGGERS.map((trigger) => {
                const isSelected = selectedTriggers?.includes(trigger) || false;
                return (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => toggleTrigger(trigger)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background hover:bg-muted border-border/80 text-muted-foreground'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {trigger}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Free-form reflection */}
          <div className="space-y-2">
            <label htmlFor="reflection-textarea" className="text-sm font-semibold text-card-foreground flex items-center gap-1">
              <Frown className="h-4.5 w-4.5 text-primary" />
              Daily Reflection
            </label>
            <p className="text-xs text-muted-foreground">What is on your mind today? (Your concerns, doubts, plans, or breakthroughs. This text will be analyzed by CalmGuide to provide wellness recommendations).</p>
            <textarea
              id="reflection-textarea"
              rows={4}
              {...register('reflection')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
              placeholder="E.g., I'm feeling stressed about my upcoming chemistry mock test. My scores have been dropping and I feel like I'm running out of time..."
            />
            {errors.reflection && (
              <p className="text-xs text-destructive font-medium">{errors.reflection.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-card/95 backdrop-blur-md pt-4 pb-2 border-t border-border/60 flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:opacity-90 active:scale-98 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Check-In
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
export default DailyCheckInDialog;
