'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWellness } from '@/components/layout/WellnessProvider';
import { supabase } from '@/lib/supabase';
import { JournalEntry } from '@/types';
import {
  BookOpen,
  Search,
  Calendar,
  Sparkles,
  PlusCircle,
  HelpCircle,
  Smile,
  Meh,
  Frown,
  RefreshCw,
  Clock,
  ChevronRight,
  Bookmark,
} from 'lucide-react';

export default function JournalPage() {
  const { userId, userLoading, geminiKey } = useWellness();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  // Form states
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchJournalEntries = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      
      // Auto-select the first entry if none is selected
      if (data && data.length > 0 && !activeEntry) {
        setActiveEntry(data[0] as JournalEntry);
      }
    } catch (err) {
      console.error('Error fetching journal entries:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, activeEntry]);

  useEffect(() => {
    if (!userLoading && userId) {
      fetchJournalEntries();
    }
  }, [userId, userLoading, fetchJournalEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!newContent.trim()) {
      setSubmitError('Journal entry content cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey || '',
        },
        body: JSON.stringify({
          user_id: userId,
          content: newContent.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save journal entry.');
      }

      setNewContent('');
      // Refetch journal list
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      const updatedList = data || [];
      setEntries(updatedList);
      if (updatedList.length > 0) {
        setActiveEntry(updatedList[0] as JournalEntry);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic in client-side
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (entry.ai_summary && entry.ai_summary.toLowerCase().includes(searchQuery.toLowerCase()));

    const entryDate = new Date(entry.created_at);
    entryDate.setHours(0, 0, 0, 0);

    const matchesStart = startDate 
      ? entryDate >= new Date(startDate) 
      : true;

    const matchesEnd = endDate 
      ? entryDate <= new Date(endDate) 
      : true;

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Get sentiment tag visual styling
  const getSentimentDetails = (score?: number) => {
    if (score === undefined || score === null) {
      return { label: 'Neutral', bg: 'bg-muted border-border/50 text-muted-foreground', icon: Meh };
    }
    if (score > 0.25) {
      return { label: `Positive (${score.toFixed(2)})`, bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500', icon: Smile };
    }
    if (score < -0.25) {
      return { label: `Anxious/Stressed (${score.toFixed(2)})`, bg: 'bg-red-500/10 border-red-500/20 text-red-500', icon: Frown };
    }
    return { label: `Neutral (${score.toFixed(2)})`, bg: 'bg-secondary border-border/80 text-muted-foreground', icon: Meh };
  };

  if (userLoading || (loading && entries.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Opening journal vaults...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      {/* Sidebar: Filters & Journal List (Span 1) */}
      <div className="lg:col-span-1 bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4 h-[750px] flex flex-col">
        
        <div className="border-b border-border/40 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <BookOpen className="h-4.5 w-4.5 text-primary" />
            Reflection Journal
          </h2>
          <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-full font-bold">
            {filteredEntries.length} entries
          </span>
        </div>

        {/* Search & Date Filters */}
        <div className="space-y-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search content or summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Date range inputs */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="space-y-1">
              <label htmlFor="start-date" className="font-semibold text-muted-foreground">From Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1 text-[11px] text-foreground outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="end-date" className="font-semibold text-muted-foreground">To Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-2.5 py-1 text-[11px] text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Entries scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredEntries.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground px-4">
              <Clock className="h-7 w-7 text-muted-foreground/60 mb-1.5" />
              <p className="text-xs font-semibold">No journal entries found</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">Try adjusting your filters or write a new entry.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const sentiment = getSentimentDetails(entry.sentiment_score);
              const SvgIcon = sentiment.icon;
              const isActive = activeEntry?.id === entry.id;
              
              return (
                <button
                  key={entry.id}
                  onClick={() => setActiveEntry(entry)}
                  className={`w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 hover:bg-muted bg-background/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground font-semibold">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-0.5 ${sentiment.bg}`}>
                      <SvgIcon className="h-2.5 w-2.5" />
                      {sentiment.label.split(' ')[0]}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate mt-1.5">
                    {entry.ai_summary || 'Reflection Entry'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {entry.content}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Journal Workspace (Span 2) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Write new entry card */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3.5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-primary" />
            Write Reflection Entry
          </h3>
          <p className="text-xs text-muted-foreground">Expressing your thoughts and mock pressure on paper helps ease exam anxiety. CalmGuide will automatically analyze the text to extract emotional patterns.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              rows={5}
              placeholder="How are you managing your mock test scores? What is making you anxious, and how can we address it? Write it down..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
            />
            {submitError && (
              <p className="text-xs text-destructive font-medium">{submitError}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newContent.trim()}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/10 transition hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" />
                    Save & Analyze Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Selected entry display card */}
        {activeEntry ? (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            
            {/* Entry metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Journal Workspace</span>
                <h3 className="text-sm font-bold text-foreground">
                  {new Date(activeEntry.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${getSentimentDetails(activeEntry.sentiment_score).bg}`}>
                  {React.createElement(getSentimentDetails(activeEntry.sentiment_score).icon, { className: 'h-3.5 w-3.5' })}
                  Sentiment: {getSentimentDetails(activeEntry.sentiment_score).label}
                </span>
              </div>
            </div>

            {/* AI Generated Insights Section */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
                AI Generated Insight
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Summary:</span> {activeEntry.ai_summary || "Our AI coach is compiling your summary. Check back in a few seconds."}
              </p>
            </div>

            {/* Content Display */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">Reflected Thoughts</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/20 rounded-xl p-4 border border-border/30">
                {activeEntry.content}
              </p>
            </div>

          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/50 text-muted-foreground flex flex-col items-center justify-center">
            <BookOpen className="h-8 w-8 mb-2 text-muted-foreground/60" />
            <h3 className="text-sm font-semibold">No active entry selected</h3>
            <p className="text-xs max-w-xs mx-auto mt-1 leading-relaxed">Write a reflection entry above or click on a log in the sidebar to review detailed AI analyses.</p>
          </div>
        )}

      </div>

    </div>
  );
}
