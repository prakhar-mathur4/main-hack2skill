import React from 'react';
import { WellnessRecommendations } from '@/types';
import { BookOpen, Brain, Dumbbell, Moon, CheckSquare } from 'lucide-react';

interface RecommendationsListProps {
  recommendations: WellnessRecommendations | null;
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (!recommendations) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <CheckSquare className="h-8 w-8 text-muted-foreground/60 mb-2" />
        <h3 className="text-sm font-semibold text-foreground">No Recommendations</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
          Submit your daily check-in to get custom study-life balance and coping recommendations.
        </p>
      </div>
    );
  }

  const sections = [
    {
      title: 'Study & Workload',
      items: recommendations.study || [],
      icon: BookOpen,
      colorClass: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      title: 'Mental Wellness',
      items: recommendations.mental || [],
      icon: Brain,
      colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Physical Wellness',
      items: recommendations.physical || [],
      icon: Dumbbell,
      colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Rest & Sleep',
      items: recommendations.sleep || [],
      icon: Moon,
      colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="border-b border-border/40 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Personalized Wellness Actions</h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
          Updated Today
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`p-2 rounded-xl border ${section.colorClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">{section.title}</h4>
              </div>

              {section.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-1">Everything looks balanced in this area.</p>
              ) : (
                <ul className="space-y-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="text-primary font-bold select-none shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default RecommendationsList;
