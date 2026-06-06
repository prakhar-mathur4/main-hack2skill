import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { openai, isOpenAiConfigured } from '@/lib/openai';
import { getGeminiApiKey, generateGeminiContent } from '@/lib/gemini';
import { DailyCheckInSchema } from '@/validators/checkin';
import { calculateBurnoutRisk } from '@/features/wellness/burnoutCalculator';
import { MoodEntry, WellnessRecommendations } from '@/types';

// Rate limiter helper in memory (basic rate limiting for public endpoint)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // max 10 checkins per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [now]);
    return false;
    }
  const timestamps = rateLimitMap.get(ip)!.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= MAX_REQUESTS) {
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous-ip';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { user_id, ...checkInRaw } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required for partitioning data' }, { status: 400 });
    }

    // 1. Validate check-in input using Zod
    const validationResult = DailyCheckInSchema.safeParse(checkInRaw);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid check-in details', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const checkInData = validationResult.data;

    // 2. Insert mood entry into Supabase
    const { data: moodEntry, error: moodError } = await supabase
      .from('mood_entries')
      .insert({
        user_id,
        mood_score: checkInData.mood_score,
        stress_level: checkInData.stress_level,
        energy_level: checkInData.energy_level,
        sleep_hours: checkInData.sleep_hours,
        study_hours: checkInData.study_hours,
        primary_emotion: checkInData.primary_emotion,
        reflection: checkInData.reflection || null,
      })
      .select()
      .single();

    if (moodError) {
      console.error('Database error creating mood entry:', moodError);
      return NextResponse.json({ error: 'Failed to record mood entry' }, { status: 500 });
    }

    // 3. Insert triggers (if selected)
    if (checkInData.triggers && checkInData.triggers.length > 0) {
      const triggersToInsert = checkInData.triggers.map((trigger) => ({
        user_id,
        mood_entry_id: moodEntry.id,
        trigger_name: trigger,
      }));

      const { error: triggersError } = await supabase
        .from('stress_triggers')
        .insert(triggersToInsert);

      if (triggersError) {
        console.error('Database error creating stress triggers:', triggersError);
        // We do not fail the entire request, just log and continue
      }
    }

    // 4. Fetch recent history to compute baseline burnout risk (up to past 5 entries including current)
    const { data: pastEntries } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(6); // get current + 5 previous

    const recentEntriesList: MoodEntry[] = pastEntries || [moodEntry];
    const baseBurnoutResult = calculateBurnoutRisk(recentEntriesList);

    // 5. Generate AI Insights / Sentiment Analysis / Recommendation
    let finalBurnoutScore = baseBurnoutResult.score;
    let finalBurnoutLevel = baseBurnoutResult.level;
    let recommendations: WellnessRecommendations = {
      study: [
        'Take a 10-minute break every 50 minutes using the Pomodoro technique.',
        'Organize your study desk to reduce mental distractions.',
      ],
      mental: [
        'Practice a 5-minute boxed breathing exercise to settle anxiety.',
        'Celebrate small wins like completing a set of questions.',
      ],
      physical: [
        'Step outside for a 10-minute walk in natural sunlight.',
        'Keep a water bottle nearby and drink at least 2 liters of water.',
      ],
      sleep: [
        'Stop studying 1 hour before sleeping to wind down.',
        'Keep your phone away from the bed to avoid late-night screens.',
      ],
    };
    let aiInsightText = baseBurnoutResult.explanation;
    let sentimentLabel = 'Neutral';

    const clientGeminiKey = request.headers.get('x-gemini-key');
    const geminiKey = getGeminiApiKey(clientGeminiKey);
    const isGeminiAvailable = !!geminiKey;

    const systemPrompt = `You are a professional, empathetic student wellness AI coach supporting students preparing for high-stakes examinations (NEET, JEE, CAT, etc.).
Your goal is to analyze the student's daily check-in reflection, calculate a burnout score modifier, classify sentiment, and generate actionable, non-clinical recommendations.

SAFETY RULES:
- Never diagnose mental illness or medical conditions.
- Never suggest clinical treatments, therapy, or drugs.
- Do not provide medical advice. Keep your response supportive, focusing on stress management, time management, sleep, study habits, and exercise.
- Keep recommendations highly actionable and tailored specifically to students.

You must respond with a strictly formatted JSON object matching the following structure:
{
  "summary": "Brief 1-2 sentence empathetic summary of their reflection",
  "sentiment": "Happy | Calm | Motivated | Neutral | Overwhelmed | Anxious | Burnt Out | Frustrated | Sad",
  "burnoutScoreModifier": -10, // A number between -15 and +15 representing how much the reflection text adds or subtracts from their burnout risk
  "riskExplanation": "A supportive explanation of their current burnout risk, referencing factors they mentioned",
  "contributingFactors": ["Factor 1", "Factor 2"],
  "recommendations": {
    "study": ["study tip 1", "study tip 2"],
    "mental": ["mindfulness tip 1", "mindfulness tip 2"],
    "physical": ["exercise tip 1", "exercise tip 2"],
    "sleep": ["sleep tip 1", "sleep tip 2"]
  },
  "encouragement": "A highly motivating, reassuring, and positive closing message"
}`;

    const userPrompt = `DAILY CHECK-IN DATA:
- Mood Score: ${checkInData.mood_score}/10
- Primary Emotion: ${checkInData.primary_emotion}
- Stress Level: ${checkInData.stress_level}
- Energy Level: ${checkInData.energy_level}
- Sleep Hours: ${checkInData.sleep_hours} hrs
- Study Hours: ${checkInData.study_hours} hrs
- Selected Triggers: ${checkInData.triggers.join(', ') || 'None'}
- Reflection Text: "${checkInData.reflection}"
- Base Calculated Burnout Score: ${baseBurnoutResult.score} (${baseBurnoutResult.level})

Analyze this data and return the structured JSON object.`;

    if (isGeminiAvailable && checkInData.reflection?.trim()) {
      try {
        console.log('Running check-in analysis with Gemini...');
        const responseText = await generateGeminiContent(geminiKey, systemPrompt, userPrompt, true);
        const parsedContent = JSON.parse(responseText || '{}');

        if (parsedContent) {
          sentimentLabel = parsedContent.sentiment || sentimentLabel;
          const modifier = Number(parsedContent.burnoutScoreModifier) || 0;
          finalBurnoutScore = Math.max(0, Math.min(100, finalBurnoutScore + modifier));
          if (finalBurnoutScore > 70) {
            finalBurnoutLevel = 'High Risk';
          } else if (finalBurnoutScore > 35) {
            finalBurnoutLevel = 'Moderate Risk';
          } else {
            finalBurnoutLevel = 'Low Risk';
          }
          recommendations = parsedContent.recommendations || recommendations;
          aiInsightText = parsedContent.riskExplanation || aiInsightText;
        }
      } catch (geminiError) {
        console.error('Error invoking Gemini in check-in route:', geminiError);
        // Fallback to OpenAI if configured, otherwise rule-based fallback
        if (isOpenAiConfigured()) {
          await runOpenAiAnalysis();
        }
      }
    } else if (isOpenAiConfigured() && checkInData.reflection?.trim()) {
      await runOpenAiAnalysis();
    }

    async function runOpenAiAnalysis() {
      try {
        console.log('Running check-in analysis with OpenAI...');
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const parsedContent = JSON.parse(response.choices[0].message.content || '{}');

        if (parsedContent) {
          sentimentLabel = parsedContent.sentiment || sentimentLabel;
          const modifier = Number(parsedContent.burnoutScoreModifier) || 0;
          finalBurnoutScore = Math.max(0, Math.min(100, finalBurnoutScore + modifier));
          if (finalBurnoutScore > 70) {
            finalBurnoutLevel = 'High Risk';
          } else if (finalBurnoutScore > 35) {
            finalBurnoutLevel = 'Moderate Risk';
          } else {
            finalBurnoutLevel = 'Low Risk';
          }
          recommendations = parsedContent.recommendations || recommendations;
          aiInsightText = parsedContent.riskExplanation || aiInsightText;
        }
      } catch (openAiError) {
        console.error('Error invoking OpenAI in check-in route:', openAiError);
      }
    }

    // 6. Insert AI insight into Supabase
    const { data: insightRecord, error: insightError } = await supabase
      .from('ai_insights')
      .insert({
        user_id,
        burnout_score: finalBurnoutScore,
        burnout_level: finalBurnoutLevel,
        recommendation: recommendations,
        insight: aiInsightText,
      })
      .select()
      .single();

    if (insightError) {
      console.error('Database error saving AI insights:', insightError);
    }

    return NextResponse.json({
      success: true,
      moodEntry,
      burnout: {
        score: finalBurnoutScore,
        level: finalBurnoutLevel,
        explanation: aiInsightText,
        factors: baseBurnoutResult.factors,
      },
      recommendations,
      sentiment: sentimentLabel,
    });
  } catch (err: any) {
    console.error('Internal server error in check-in:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
