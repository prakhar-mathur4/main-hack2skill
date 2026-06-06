'use client';

import React from 'react';
import { StressTrigger } from '@/types';
import { ShieldAlert, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';

interface TriggerAnalysisProps {
  triggers: StressTrigger[];
}

export function TriggerAnalysis({ triggers }: TriggerAnalysisProps) {
  if (!triggers || triggers.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2.5" />
        <h3 className="text-sm font-semibold text-foreground">No Trigger Logs Yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          Select triggers when doing your daily check-in to analyze your stress sources.
        </p>
      </div>
    );
  }

  // 1. Calculate frequency of each trigger type
  const counts: Record<string, number> = {};
  triggers.forEach((t) => {
    counts[t.trigger_name] = (counts[t.trigger_name] || 0) + 1;
  });

  // Convert to sorted array
  const rankedTriggers = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topTrigger = rankedTriggers[0];
  const totalTriggerLogs = triggers.length;

  // 2. Simple Trend Analysis: Compare first half of logs with second half (recency)
  // Let's divide by dates: newer logs vs older logs
  const sortedByDate = [...triggers].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const midPoint = Math.floor(sortedByDate.length / 2);
  const olderTriggers = sortedByDate.slice(0, midPoint);
  const newerTriggers = sortedByDate.slice(midPoint);

  const olderCounts: Record<string, number> = {};
  olderTriggers.forEach((t) => {
    olderCounts[t.trigger_name] = (olderCounts[t.trigger_name] || 0) + 1;
  });

  const newerCounts: Record<string, number> = {};
  newerTriggers.forEach((t) => {
    newerCounts[t.trigger_name] = (newerCounts[t.trigger_name] || 0) + 1;
  });

  // Find a trigger that is increasing the most in frequency
  let risingTrigger = '';
  let maxIncrease = -999;
  
  Object.keys(counts).forEach((name) => {
    const olderRatio = olderTriggers.length > 0 ? (olderCounts[name] || 0) / olderTriggers.length : 0;
    const newerRatio = newerTriggers.length > 0 ? (newerCounts[name] || 0) / newerTriggers.length : 0;
    const increase = newerRatio - olderRatio;
    
    if (increase > maxIncrease && (newerCounts[name] || 0) > 0) {
      maxIncrease = increase;
      risingTrigger = name;
    }
  });

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-5 h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <BarChart3 className="h-4.5 w-4.5 text-primary" />
          Stress Trigger Analysis
        </h3>
        <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-full font-bold">
          {totalTriggerLogs} Logged Triggers
        </span>
      </div>

      {/* Top Source Spotlight Card */}
      {topTrigger && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Most Common Stress Source</p>
            <p className="text-sm font-bold text-card-foreground truncate mt-0.5">{topTrigger.name}</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Identified in {Math.round((topTrigger.count / totalTriggerLogs) * 100)}% of your stress entries.
            </p>
          </div>
        </div>
      )}

      {/* Ranking List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-foreground">Trigger Frequency Ranking</h4>
        <div className="space-y-2.5">
          {rankedTriggers.map((trigger, idx) => {
            const percentage = Math.round((trigger.count / totalTriggerLogs) * 100);
            return (
              <div key={trigger.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-card-foreground">
                    {idx + 1}. {trigger.name}
                  </span>
                  <span className="text-muted-foreground">{trigger.count} times ({percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trigger Trends */}
      {risingTrigger && maxIncrease > 0.05 && (
        <div className="border-t border-border/40 pt-4 flex gap-2.5 items-start text-xs text-muted-foreground">
          <TrendingUp className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Rising Trend:</span>{' '}
            We noticed <span className="font-semibold text-foreground">"{risingTrigger}"</span> is contributing more to your stress levels in recent days. Look at the Wellness Recommendations to manage this source.
          </div>
        </div>
      )}

    </div>
  );
}
export default TriggerAnalysis;
