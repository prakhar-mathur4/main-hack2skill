import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { openai, isOpenAiConfigured } from '@/lib/openai';
import { getGeminiApiKey, generateGeminiContent } from '@/lib/gemini';
import { JournalSubmissionSchema } from '@/validators/checkin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, content } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 1. Validate journal input
    const validationResult = JournalSubmissionSchema.safeParse({ content });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid journal content', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // 2. Perform Sentiment Analysis and Summarization
    let sentimentScore = 0.0; // neutral default
    let aiSummaryText = 'Journal entry recorded.';

    const clientGeminiKey = request.headers.get('x-gemini-key');
    const geminiKey = getGeminiApiKey(clientGeminiKey);
    const isGeminiAvailable = !!geminiKey;

    const systemPrompt = `You are a helpful student wellness assistant. Analyze the following journal entry written by a student preparing for high-pressure examinations.
Determine:
1. Sentiment Score: a numeric value between -1.00 (extremely negative/anxious/burnt out) and +1.00 (extremely positive/calm/motivated).
2. AI Summary: A concise 1-sentence summary of what they are reflecting on.

Respond with a strictly formatted JSON object:
{
  "sentiment_score": 0.35,
  "ai_summary": "Summary of the entry..."
}`;

    if (isGeminiAvailable && content.trim()) {
      try {
        console.log('Running journal analysis with Gemini...');
        const responseText = await generateGeminiContent(geminiKey, systemPrompt, `Journal content: "${content}"`, true);
        const parsedContent = JSON.parse(responseText || '{}');
        if (parsedContent) {
          sentimentScore = Number(parsedContent.sentiment_score) ?? 0.0;
          aiSummaryText = parsedContent.ai_summary || aiSummaryText;
        }
      } catch (geminiError) {
        console.error('Gemini error in journal API route:', geminiError);
        if (isOpenAiConfigured()) {
          await runOpenAiAnalysis();
        } else {
          runLocalAnalysis();
        }
      }
    } else if (isOpenAiConfigured() && content.trim()) {
      await runOpenAiAnalysis();
    } else {
      runLocalAnalysis();
    }

    async function runOpenAiAnalysis() {
      try {
        console.log('Running journal analysis with OpenAI...');
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Journal content: "${content}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const parsedContent = JSON.parse(response.choices[0].message.content || '{}');
        if (parsedContent) {
          sentimentScore = Number(parsedContent.sentiment_score) ?? 0.0;
          aiSummaryText = parsedContent.ai_summary || aiSummaryText;
        }
      } catch (aiError) {
        console.error('OpenAI error in journal API route:', aiError);
        runLocalAnalysis();
      }
    }

    function runLocalAnalysis() {
      // Basic rule-based fallback sentiment scoring
      const lower = content.toLowerCase();
      let positiveCount = 0;
      let negativeCount = 0;

      const positiveKeywords = ['happy', 'good', 'calm', 'relax', 'confident', 'motivated', 'productive', 'clear', 'better', 'focused', 'success', 'solve'];
      const negativeKeywords = ['sad', 'anxious', 'stress', 'fear', 'burnt', 'tired', 'stuck', 'hard', 'mock', 'fail', 'bad', 'parent', 'pressure', 'worry', 'scared'];

      positiveKeywords.forEach((word) => {
        if (lower.includes(word)) positiveCount++;
      });
      negativeKeywords.forEach((word) => {
        if (lower.includes(word)) negativeCount++;
      });

      if (positiveCount + negativeCount > 0) {
        sentimentScore = (positiveCount - negativeCount) / (positiveCount + negativeCount);
      } else {
        sentimentScore = 0.0;
      }

      // Generate a simple fallback summary
      const firstSentence = content.split(/[.!?]/)[0] || '';
      aiSummaryText = firstSentence.length > 80 
        ? firstSentence.slice(0, 80) + '...' 
        : firstSentence || 'Personal reflection entry.';
    }

    // 3. Write to Supabase journal_entries
    const { data: journalRecord, error: journalError } = await supabase
      .from('journal_entries')
      .insert({
        user_id,
        content,
        sentiment_score: sentimentScore,
        ai_summary: aiSummaryText,
      })
      .select()
      .single();

    if (journalError) {
      console.error('Database error saving journal entry:', journalError);
      return NextResponse.json({ error: 'Failed to record journal entry' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      journalEntry: journalRecord,
    });
  } catch (err: any) {
    console.error('Internal server error in journal route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
