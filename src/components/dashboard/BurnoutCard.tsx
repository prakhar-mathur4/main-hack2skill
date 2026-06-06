import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BurnoutCardProps {
  score: number;
  level: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  explanation: string;
  factors: string[];
}

export function BurnoutCard({ score, level, explanation, factors }: BurnoutCardProps) {
  // Determine color theme based on risk level
  const getTheme = () => {
    switch (level) {
      case 'High Risk':
        return {
          bg: 'bg-red-500/5',
          border: 'border-red-500/20',
          text: 'text-red-500',
          barColor: 'bg-red-500',
          icon: ShieldAlert,
        };
      case 'Moderate Risk':
        return {
          bg: 'bg-amber-500/5',
          border: 'border-amber-500/20',
          text: 'text-amber-500',
          barColor: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'Low Risk':
      default:
        return {
          bg: 'bg-emerald-500/5',
          border: 'border-emerald-500/20',
          text: 'text-emerald-500',
          barColor: 'bg-emerald-500',
          icon: CheckCircle2,
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h3 className="text-sm font-bold text-foreground">Burnout Risk Detector</h3>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}>
          {level}
        </span>
      </div>

      {/* Main Grid: Score Gauge + Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        
        {/* Score Gauge */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/30 border border-border/20 text-center col-span-1">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{score}</span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Risk Score</span>
          <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden mt-2">
            <div className={`h-full ${theme.barColor} rounded-full`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* Explanation */}
        <div className="col-span-2 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Icon className={`h-4.5 w-4.5 shrink-0 ${theme.text}`} />
            Analysis Summary
          </p>
          <p>{explanation}</p>
        </div>
      </div>

      {/* Contributing Factors */}
      {factors && factors.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-2">
          <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider">Contributing Risk Factors</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {factors.map((factor, index) => (
              <li key={index} className="flex gap-2 items-start text-xs text-muted-foreground">
                <span className="text-red-500 font-bold shrink-0">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
export default BurnoutCard;
