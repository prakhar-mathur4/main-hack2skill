import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAiConfigured } from '@/lib/openai';
import { getGeminiApiKey, streamGeminiContent } from '@/lib/gemini';

export const runtime = 'edge'; // Run on Vercel Edge for maximum performance and instant streaming

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const currentContext = context || {};
    const isResultSeasonMode = !!currentContext.isResultSeasonMode;
    const primaryEmotion = currentContext.primaryEmotion || 'neutral';
    const stressLevel = currentContext.stressLevel || 'medium';
    const sleepHours = currentContext.sleepHours || 7;

    // 1. Safety guidelines and personality setup
    let systemPrompt = `You are a professional, highly empathetic student wellness AI coach named "CalmGuide". You are supporting a student preparing for high-pressure examinations (such as NEET, JEE, GATE, CAT, UPSC, etc.).

CONVERSATION RULES (MANDATORY):
1. SAFETY GATES:
   - You are NOT a medical professional or a licensed therapist.
   - Never diagnose mental illnesses (e.g., Clinical Depression, GAD, ADHD, PTSD).
   - Never prescribe medication or treatments.
   - If the user hints at self-harm, suicide, or severe psychiatric distress, respond with standard crisis helpline information: "If you are feeling overwhelmed and having thoughts of self-harm, please reach out immediately to a helpline like AASRA (91-9820466726) or Vandrevala Foundation (91-9999666555) or contact a mental health professional."
   - Strictly frame your help as stress management, mindfulness, exam prep tactics, study routine structuring, sleep hygiene, and coping strategies.
2. EMPATHETIC COMMUNICATION:
   - Listen actively. Start by validating their emotional state in a warm, non-judgmental way.
   - Speak in a calm, encouraging, and supportive tone.
   - Suggest 2-3 specific, small, actionable actions they can take (e.g. Pomodoro technique, 4-7-8 breathing, drinking water, taking a walk).
   - Ask one open-ended question at the end to keep them reflecting, but keep your responses short (under 150 words) to prevent overwhelming them.`;

    if (isResultSeasonMode) {
      systemPrompt += `\n\nRESULT SEASON SUPPORT MODE ACTIVATED:
- The student is currently facing the intense pressure, anxiety, or disappointment of exam results.
- Focus heavily on perspective-building: remind them that exams do not define their self-worth or life path.
- Provide reassurance on coping with disappointment, handling parental expectations, and dealing with uncertainty.
- Share strategies for emotional resilience, mapping out alternative action plans, and practicing self-compassion.`;
    }

    systemPrompt += `\n\nSTUDENT'S CURRENT STATE CONTEXT:
- Primary Emotion: ${primaryEmotion}
- Stress Level: ${stressLevel}
- Sleep Hours: ${sleepHours} hours/day`;

    const clientGeminiKey = request.headers.get('x-gemini-key');
    const geminiKey = getGeminiApiKey(clientGeminiKey);
    const isGeminiAvailable = !!geminiKey;

    // 2. Stream with Gemini if key is available
    if (isGeminiAvailable) {
      console.log('Streaming chat response with Gemini...');
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            const trimmedHistory = messages.slice(-10).map((msg: any) => ({
              role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: String(msg.content || ''),
            }));

            const generator = streamGeminiContent(geminiKey, systemPrompt, trimmedHistory);
            for await (const chunk of generator) {
              controller.enqueue(encoder.encode(chunk));
            }
          } catch (err) {
            console.error('Error in Gemini stream generator:', err);
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // 3. Prepare OpenAI messages list
    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    // 4. Handle simulation mode if OpenAI API key is missing
    if (!isOpenAiConfigured()) {
      const lastMessage = messages[messages.length - 1]?.content || '';
      const fallbackResponse = simulateResponse(lastMessage, primaryEmotion, isResultSeasonMode);
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Stream the response with micro-delays to simulate typing
          const words = fallbackResponse.split(' ');
          for (const word of words) {
            controller.enqueue(encoder.encode(word + ' '));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // 5. Stream response from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAiMessages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 400,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err: any) {
    console.error('Error in chat API route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fallback response simulation for offline or key-missing environments
function simulateResponse(msg: string, emotion: string, resultMode: boolean): string {
  const normalized = msg.toLowerCase();
  
  if (normalized.includes('suicide') || normalized.includes('kill myself') || normalized.includes('die')) {
    return "I hear how incredibly heavy things are for you right now, and I want to support you, but as an AI, I cannot provide crisis intervention. Please reach out immediately to a helpline where professional support is available. You can contact AASRA at 91-9820466726 or Vandrevala Foundation at 91-9999666555. They have people who care and want to listen. Please stay safe.";
  }

  if (resultMode) {
    return "I understand this exam result season feels completely overwhelming and that mock test or final scores are weighing heavily on you. Please remember that this exam is just a single milestone, not a final verdict on your intelligence or your future success. Take a slow, deep breath. Let's focus on what we can control today. Would you like to talk about how to deal with parental expectations, or look at some gentle ways to build up your confidence?";
  }

  if (emotion === 'Burnt Out' || emotion === 'Overwhelmed') {
    return "It sounds like you have been pushing yourself extremely hard, and your mind and body are sending you signals to slow down. High-pressure exams are a marathon, not a sprint. I recommend setting a hard stop time for study today, drinking some water, and taking a 10-minute walk without your phone. How does that sound, and what is the biggest thing keeping you from taking a break right now?";
  }

  if (emotion === 'Anxious' || normalized.includes('scared') || normalized.includes('anxious')) {
    return "Anxiety is a very natural response when preparing for such competitive exams, but it doesn't mean you aren't capable. Let's take a moment to ground ourselves. Can we try a simple box breath? Inhale for 4 seconds, hold for 4, exhale for 4, and hold for 4. Doing this a few times can help settle your nervous system. What specific part of your preparation is causing the most worry today?";
  }

  return "Thank you for sharing that with me. Preparing for examinations is a challenging journey, and it's completely normal to experience ups and downs. I'm here to listen and help you find a healthy balance between study and self-care. What is one small, manageable task you can focus on today to make progress without feeling overloaded?";
}
