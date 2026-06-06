import React from 'react';
import { ShieldAlert, Heart, Info } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-muted/30 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="mx-auto max-w-7xl">
        
        {/* Helpline Alerts Section */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Need Immediate Support?</span>
            </div>
            <p className="text-xs text-muted-foreground sm:border-l sm:border-border/50 sm:pl-3 leading-relaxed">
              MindCare is an AI helper for self-reflection and general wellness. If you are experiencing severe distress, panic, depression, or self-harm thoughts, please contact a professional immediately. Free 24/7 student-friendly helplines:
            </p>
          </div>
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/20 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Tele-MANAS (Govt of India)</span>
              <a href="tel:14416" className="text-primary hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary w-fit">14416 or 1800-891-4416</a>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Vandrevala Foundation</span>
              <a href="tel:+919999666555" className="text-primary hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary w-fit">+91 99996 66555</a>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">AASRA Helpline</span>
              <a href="tel:+919820466726" className="text-primary hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary w-fit">+91 98204 66726</a>
            </div>
          </div>
        </div>

        {/* Lower footer information */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-primary fill-primary/10" aria-hidden="true" />
            <span>Designed for student resilience.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Complies with WCAG 2.1 AA standards.</span>
            </div>
            <span>© {new Date().getFullYear()} MindCare. All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
export default Footer;
