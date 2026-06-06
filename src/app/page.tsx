'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWellness } from '@/components/layout/WellnessProvider';
import { supabase } from '@/lib/supabase';
import { MoodEntry, StressTrigger, AiInsight, PrimaryEmotion } from '@/types';
import { DailyCheckInDialog } from '@/components/checkin/DailyCheckInDialog';
import { TrendsChart } from '@/components/dashboard/TrendsChart';
import { TriggerAnalysis } from '@/components/dashboard/TriggerAnalysis';
import { RecommendationsList } from '@/components/dashboard/RecommendationsList';
import { CoachPanel } from '@/components/chat/CoachPanel';
import { BurnoutCard } from '@/components/dashboard/BurnoutCard';
import {
  Heart,
  Smile,
  Zap,
  Activity,
  Moon,
  ChevronRight,
  BookOpen,
  Calendar,
  Sparkles,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { seedDemoData } from '@/services/seedService';

export default function Home() {
  const { userId, userLoading, geminiKey } = useWellness();
  
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [triggers, setTriggers] = useState<StressTrigger[]>([]);
  const [latestInsight, setLatestInsight] = useState<AiInsight | null>(null);
  
  const [dataLoading, setDataLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [seeding, setSeeding] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setAiConfigured(!!data.openAiConfigured || !!data.geminiConfigured))
      .catch((err) => console.error('Error fetching api config status:', err));
  }, []);

  useEffect(() => {
    if (userLoading || dataLoading) return;
    if (entries.length === 0 && userId) {
      try {
        const dismissed = localStorage.getItem(`wellness_tracker_onboarded_${userId}`);
        if (dismissed !== 'true') {
          setIsOnboardingOpen(true);
        }
      } catch (e) {}
    }
  }, [entries.length, userId, userLoading, dataLoading]);

  const handleSeedData = async () => {
    if (!userId || seeding) return;
    setSeeding(true);
    try {
      const res = await seedDemoData(userId);
      if (res.success) {
        await fetchData();
      } else {
        alert(res.error || 'Failed to seed demo data');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setDataLoading(true);

    try {
      // 1. Fetch mood entries
      let moodQuery = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (timeRange === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        moodQuery = moodQuery.gte('created_at', oneWeekAgo.toISOString());
      } else if (timeRange === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        moodQuery = moodQuery.gte('created_at', oneMonthAgo.toISOString());
      }

      const { data: moodData, error: moodError } = await moodQuery;
      if (moodError) throw moodError;
      setEntries(moodData || []);

      // 2. Fetch triggers
      const { data: triggerData, error: triggerError } = await supabase
        .from('stress_triggers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (triggerError) throw triggerError;
      setTriggers(triggerData || []);

      // 3. Fetch latest AI Insight
      const { data: insightData, error: insightError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (insightError) throw insightError;
      
      if (insightData && insightData.length > 0) {
        setLatestInsight(insightData[0] as unknown as AiInsight);
      } else {
        setLatestInsight(null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [userId, timeRange]);

  useEffect(() => {
    if (!userLoading && userId) {
      fetchData();
    }
  }, [userId, userLoading, fetchData]);

  // Calculate metrics summaries
  const latestEntry = entries[0];
  const currentMood = latestEntry ? latestEntry.mood_score : '--';
  const currentStress = latestEntry ? latestEntry.stress_level : '--';
  const currentBurnout = latestInsight ? latestInsight.burnout_score : 0;
  const currentBurnoutLevel = latestInsight ? latestInsight.burnout_level : 'Low Risk';

  const averageSleep = entries.length > 0
    ? (entries.reduce((sum, e) => sum + Number(e.sleep_hours), 0) / entries.length).toFixed(1)
    : '--';

  const averageStudy = entries.length > 0
    ? (entries.reduce((sum, e) => sum + Number(e.study_hours), 0) / entries.length).toFixed(1)
    : '--';

  if (userLoading || (dataLoading && entries.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Aligning wellness frequencies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 sm:p-6 transition-colors duration-500">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Hey there! 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {entries.length === 0
              ? "Welcome to MindCare. Track your stress, log your study hours, and connect with CalmGuide - your supportive AI wellness coach."
              : "Let's check in on your exam preparation balance. Take a moment to reflect on your stress and energy levels today."}
          </p>
        </div>
        <button
          onClick={() => setCheckInOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-95 active:scale-97 transition cursor-pointer shrink-0"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Check In Today
        </button>
      </div>

      {/* API Key Missing Warning Banner */}
      {aiConfigured === false && !geminiKey && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-sm text-red-700 dark:text-red-400 font-medium items-start transition-colors duration-500 animate-in fade-in duration-300">
          <HelpCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-bold">API Key Missing (Local Fallback Active)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The application is running in local offline mode because no API Key was found. Wellness insights and coping recommendations are computed using local rule-based fallback templates. Add your Gemini API Key in <strong>Session Settings</strong> (Key icon in the header) or configure <code>GEMINI_API_KEY</code> / <code>OPENAI_API_KEY</code> on the server to enable fully personalized generative AI analysis.
            </p>
          </div>
        </div>
      )}

      {/* Main Dashboard State */}
      {entries.length === 0 ? (
        /* Empty State Onboarding */
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/50 max-w-xl mx-auto space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground">A Fresh Start to Mental Balance</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Track your daily mood, sleep, study time, and stress triggers. CalmGuide will generate customized coping strategies to prevent burnout and keep you motivated!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => setCheckInOpen(true)}
              className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95 cursor-pointer"
            >
              Log Your First Day
            </button>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="w-full sm:w-auto rounded-xl border border-border bg-background hover:bg-muted px-6 py-2.5 text-sm font-semibold text-muted-foreground transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {seeding ? (
                <>
                  <span className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></span>
                  Seeding...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Seed Demo History
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Data-populated Dashboard */
        <div className="space-y-6">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Mood */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Smile className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mood Score</span>
                <p className="text-xl font-black text-card-foreground mt-0.5">{currentMood} <span className="text-xs font-semibold text-muted-foreground">/10</span></p>
              </div>
            </div>

            {/* Metric 2: Stress */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <Activity className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stress Level</span>
                <p className="text-sm sm:text-base font-black text-card-foreground mt-0.5">{currentStress}</p>
              </div>
            </div>

            {/* Metric 3: Burnout */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <Zap className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Burnout Score</span>
                <p className="text-xl font-black text-card-foreground mt-0.5">{currentBurnout} <span className="text-[10px] font-semibold text-muted-foreground">({currentBurnoutLevel.split(' ')[0]})</span></p>
              </div>
            </div>

            {/* Metric 4: Sleep */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Moon className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sleep Avg</span>
                <p className="text-xl font-black text-card-foreground mt-0.5">{averageSleep} <span className="text-xs font-semibold text-muted-foreground">hrs</span></p>
              </div>
            </div>
          </div>

          {/* Double-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column (Span 2): Analytics & Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Burnout Risk Card */}
              {latestInsight ? (
                <BurnoutCard
                  score={latestInsight.burnout_score}
                  level={latestInsight.burnout_level}
                  explanation={latestInsight.insight}
                  factors={latestInsight.recommendation ? [] : [] /* default rule factors computed in api */}
                />
              ) : (
                <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground">Burnout Analysis</p>
                  <p className="mt-1">CalmGuide is preparing your burnout risk evaluation. Write reflection summaries during your check-ins to receive structured indicators.</p>
                </div>
              )}

              {/* Trends & Date Range Switcher */}
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-primary" />
                    Preparation History & Trends
                  </h3>
                  <div className="flex gap-1" role="radiogroup" aria-label="Time Filter">
                    {(['week', 'month', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        role="radio"
                        aria-checked={timeRange === range}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                          timeRange === range
                            ? 'bg-secondary text-primary font-bold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {range === 'week' ? '7D' : range === 'month' ? '30D' : 'All'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <TrendsChart entries={entries} />
              </div>

              {/* Wellness recommendations */}
              {latestInsight?.recommendation ? (
                <RecommendationsList recommendations={latestInsight.recommendation} />
              ) : (
                <RecommendationsList
                  recommendations={{
                    study: ['Track study hours daily', 'Take a 10-minute break after each study session'],
                    mental: ['Keep a simple reflection journal', 'Practice slow breathing under mock tests pressure'],
                    physical: ['Take short stretching walks', 'Maintain proper hydration'],
                    sleep: ['Ensure at least 7 hours of rest', 'Turn off devices 30 minutes before sleep'],
                  }}
                />
              )}
            </div>

            {/* Right Column (Span 1): AI Coach, Triggers, & Journal Quicklinks */}
            <div className="space-y-6">
              
              {/* AI Wellness Coach */}
              <CoachPanel
                latestEmotion={latestEntry?.primary_emotion}
                latestStress={latestEntry?.stress_level}
                latestSleep={Number(latestEntry?.sleep_hours)}
              />

              {/* Triggers Analysis */}
              <TriggerAnalysis triggers={triggers} />

              {/* Journal Link card */}
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Reflection Journal</h4>
                    <p className="text-[10px] text-muted-foreground">Search and write entry logs</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Writing down thoughts helps clear exam anxieties. View your journal to filter entries by dates, search keywords, and view emotional trends.
                </p>
                <Link
                  href="/journal"
                  className="flex items-center justify-between text-xs font-semibold text-primary hover:underline group mt-1"
                >
                  <span>Go to Journal</span>
                  <ChevronRight className="h-4 w-4 transition transform group-hover:translate-x-0.5" />
                </Link>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Check-In Modal Dialog */}
      <DailyCheckInDialog
        isOpen={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSuccess={fetchData}
      />

      {/* Onboarding Welcome Modal Dialog */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-5">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                <Sparkles className="h-6 w-6 animate-pulse-slow" />
              </div>
              <h2 id="onboarding-title" className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                A Fresh Start to Mental Balance
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Welcome to MindCare! Let's get you set up to manage exam pressure, track sleep, and keep study burnout at bay.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 hover:bg-muted/50 transition">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  Track Daily Wellness
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Log mood, stress levels, study hours, and sleep. Watch patterns emerge in real-time graphs.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 hover:bg-muted/50 transition">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <Smile className="h-4 w-4 text-emerald-500 shrink-0" />
                  AI Wellness Coach
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Chat with CalmGuide for active stress-relief exercises, custom advice, and study routines.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 hover:bg-muted/50 transition">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                  Reflection Journal
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Write reflections. The system extracts summaries and logs sentiment data automatically.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 hover:bg-muted/50 transition">
                <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  100% Anonymous
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  No passwords or personal data. Your history resides privately under your session ID.
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(`wellness_tracker_onboarded_${userId}`, 'true');
                  } catch (e) {}
                  setIsOnboardingOpen(false);
                  setCheckInOpen(true);
                }}
                className="flex-1 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/10 transition hover:opacity-90 active:scale-95 cursor-pointer text-center"
              >
                Log Your First Day
              </button>
              <button
                onClick={async () => {
                  try {
                    localStorage.setItem(`wellness_tracker_onboarded_${userId}`, 'true');
                  } catch (e) {}
                  setIsOnboardingOpen(false);
                  await handleSeedData();
                }}
                disabled={seeding}
                className="flex-1 rounded-xl border border-border bg-background hover:bg-muted px-5 py-2.5 text-xs font-bold text-muted-foreground transition cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {seeding ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></span>
                    Seeding Demo...
                  </>
                ) : (
                  "Explore Dashboard"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
