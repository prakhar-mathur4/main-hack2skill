'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWellness } from './WellnessProvider';
import { Heart, Key, Copy, Check, Info, ShieldAlert, Sparkles, Award, Eye, EyeOff } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { userId, restoreSession, resetSession, geminiKey, setGeminiKey } = useWellness();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [inputUserId, setInputUserId] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [copied, setCopied] = useState(false);
  const [restoredSuccess, setRestoredSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to start a fresh session? You will lose access to your current history unless you have copied and saved your Session ID first.")) {
      resetSession();
      window.location.reload();
    }
  };

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError('');
    setRestoredSuccess(false);

    if (!inputUserId.trim()) {
      setRestoreError('Please enter a valid User ID.');
      return;
    }

    const success = restoreSession(inputUserId.trim());
    if (success) {
      setRestoredSuccess(true);
      setInputUserId('');
      setTimeout(() => {
        setIsBackupOpen(false);
        setRestoredSuccess(false);
        window.location.reload(); // Refresh to reload all data for the new user ID
      }, 1500);
    } else {
      setRestoreError('Invalid ID format. Must be a valid UUID (e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-500">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2.5 transition duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <Heart className="h-6 w-6 text-primary animate-pulse-slow fill-primary/10" aria-hidden="true" />
            <span className="font-bold tracking-tight text-lg sm:text-xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              MindCare <span className="text-primary font-medium text-sm sm:text-base border-l border-border/80 pl-2 ml-1">For Students</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1" aria-label="Main Navigation">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                pathname === '/'
                  ? 'bg-secondary text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/journal"
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                pathname === '/journal'
                  ? 'bg-secondary text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Reflection Journal
            </Link>
          </nav>

          {/* Actions Panel */}
          <div className="flex items-center gap-2.5">
            {/* Session Settings Button */}
            <button
              onClick={() => setIsBackupOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Backup or restore session ID"
              title="Backup/Restore anonymous session"
            >
              <Key className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-border/30 bg-background/95 py-2 px-4 transition-colors duration-500">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 text-xs font-medium px-4 py-1 rounded-full ${
              pathname === '/' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
            }`}
          >
            <span className="font-semibold">Dashboard</span>
          </Link>
          <Link
            href="/journal"
            className={`flex flex-col items-center gap-0.5 text-xs font-medium px-4 py-1 rounded-full ${
              pathname === '/journal' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
            }`}
          >
            <span className="font-semibold">Reflection Journal</span>
          </Link>
        </div>
      </header>

      {/* Backup & Restore Modal */}
      {isBackupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="backup-modal-title">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between">
              <h2 id="backup-modal-title" className="text-xl font-bold text-card-foreground">
                Anonymous Session Settings
              </h2>
              <button
                onClick={() => {
                  setIsBackupOpen(false);
                  setRestoreError('');
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                MindCare is 100% anonymous and passwordless. Your history is stored on this browser using a unique security key. Copy this key to back up your history or restore it on another device.
              </p>

              {/* Display ID */}
              <div className="rounded-xl bg-muted p-4 border border-border/50 space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Your Private Session ID</label>
                  <div className="mt-1.5 flex items-center justify-between gap-2.5">
                    <code className="text-xs font-mono select-all break-all overflow-hidden text-ellipsis whitespace-nowrap block max-w-[280px]">
                      {userId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-1 border-t border-border/30">
                  <button
                    type="button"
                    onClick={handleResetSession}
                    className="text-xs font-semibold text-destructive hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-destructive"
                    title="Generate a brand new anonymous user ID"
                  >
                    Start Fresh Session
                  </button>
                </div>
              </div>

              {/* Gemini API Key Configuration */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <label htmlFor="gemini-key-input" className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse-slow fill-primary/10" />
                  Gemini API Key (Optional)
                </label>
                <p className="text-xs text-muted-foreground">
                  Provide your own Gemini API Key to enable custom AI coaching. If empty, the app will fallback to server default keys or local rules.
                </p>
                <div className="relative flex items-center">
                  <input
                    id="gemini-key-input"
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter your Gemini API Key..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary font-mono text-ellipsis"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    title={showKey ? 'Hide key' : 'Show key'}
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Restore Form */}
              <form onSubmit={handleRestore} className="border-t border-border/60 pt-4 space-y-3">
                <label htmlFor="restore-id-input" className="text-sm font-semibold text-card-foreground block">
                  Restore Session
                </label>
                <p className="text-xs text-muted-foreground">Paste a backed-up Session ID below to load your history:</p>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    id="restore-id-input"
                    type="text"
                    placeholder="Paste your UUID here..."
                    value={inputUserId}
                    onChange={(e) => setInputUserId(e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary cursor-pointer shrink-0"
                  >
                    Load
                  </button>
                </div>

                {restoreError && (
                  <div className="flex gap-1.5 text-xs text-destructive mt-1.5 font-medium items-center">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}

                {restoredSuccess && (
                  <div className="text-xs text-emerald-500 mt-1.5 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Session restored! Reloading...
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default Header;
