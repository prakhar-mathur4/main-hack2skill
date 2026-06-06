'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MoodEntry, StressLevel } from '@/types';

interface TrendsChartProps {
  entries: MoodEntry[];
}

const stressMap: Record<StressLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export function TrendsChart({ entries }: TrendsChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mood' | 'stress' | 'sleep' | 'study'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-card rounded-2xl border border-border/50">
        <span className="text-sm text-muted-foreground">Loading interactive trends...</span>
      </div>
    );
  }

  // Format and sort data chronologically (earliest to latest)
  const chartData = [...entries]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((entry) => {
      const date = new Date(entry.created_at);
      return {
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: entry.mood_score,
        stress: stressMap[entry.stress_level],
        sleep: Number(entry.sleep_hours),
        study: Number(entry.study_hours),
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center bg-card rounded-2xl border border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">No wellness history found yet.</p>
        <p className="text-xs text-muted-foreground/80 mt-1">Submit your daily check-in to begin visualizing trends.</p>
      </div>
    );
  }

  const renderMoodChart = () => (
    <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex-1 min-w-[280px]">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
        <span>Mood Score Trend</span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">1 - 10</span>
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border), 0.1)" />
            <XAxis dataKey="dateStr" tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <YAxis domain={[1, 10]} tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
            />
            <Area type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorMood)" name="Mood" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderStressChart = () => (
    <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex-1 min-w-[280px]">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
        <span>Stress Level Trend</span>
        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">Low - High</span>
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border), 0.1)" />
            <XAxis dataKey="dateStr" tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <YAxis
              domain={[1, 3]}
              ticks={[1, 2, 3]}
              tickFormatter={(v) => (v === 1 ? 'Low' : v === 2 ? 'Med' : 'High')}
              tick={{ fontSize: 9 }}
              stroke="rgba(var(--color-foreground), 0.4)"
            />
            <Tooltip
              formatter={(value) => (value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High')}
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
            />
            <Line type="monotone" dataKey="stress" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4 }} name="Stress" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderSleepChart = () => (
    <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex-1 min-w-[280px]">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
        <span>Sleep Hours Trend</span>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">Hours</span>
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border), 0.1)" />
            <XAxis dataKey="dateStr" tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <YAxis tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
            />
            <Area type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSleep)" name="Sleep (hrs)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderStudyChart = () => (
    <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex-1 min-w-[280px]">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
        <span>Study Hours Trend</span>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Hours</span>
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border), 0.1)" />
            <XAxis dataKey="dateStr" tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <YAxis tick={{ fontSize: 9 }} stroke="rgba(var(--color-foreground), 0.4)" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
            />
            <Area type="monotone" dataKey="study" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStudy)" name="Study (hrs)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Chart View Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Wellness Charts Toggle">
        {(['all', 'mood', 'stress', 'sleep', 'study'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              activeTab === tab
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-card hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All Metrics' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid rendering */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderMoodChart()}
          {renderStressChart()}
          {renderSleepChart()}
          {renderStudyChart()}
        </div>
      )}

      {activeTab === 'mood' && renderMoodChart()}
      {activeTab === 'stress' && renderStressChart()}
      {activeTab === 'sleep' && renderSleepChart()}
      {activeTab === 'study' && renderStudyChart()}
    </div>
  );
}
export default TrendsChart;
