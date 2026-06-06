import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: 'mock-db-id', mood_score: 8, sleep_hours: 7.5, study_hours: 6 },
    error: null,
  });

  const mockFrom = vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: '1', mood_score: 8, stress_level: 'Low', sleep_hours: 8, study_hours: 6, primary_emotion: 'Calm', created_at: new Date().toISOString() }
            ],
            error: null,
          }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    })
  });

  return {
    supabase: {
      from: mockFrom,
    },
  };
});

// Import route handlers (since we are testing their direct functions)
import { POST as checkInHandler } from '../app/api/check-in/route';
import { POST as journalHandler } from '../app/api/journal/route';
import { POST as chatHandler } from '../app/api/chat/route';

describe('API Routes Integration Tests', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.clearAllMocks();

    // Mock global.fetch for Gemini APIs
    global.fetch = vi.fn().mockImplementation((url: string, init?: any) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        if (url.includes('streamGenerateContent')) {
          const mockStream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(
                encoder.encode(
                  'data: {"candidates":[{"content":{"parts":[{"text":"Hello, I am CalmGuide. Let\'s manage your stress."}]}}]}\n'
                )
              );
              controller.close();
            },
          });
          return Promise.resolve({
            ok: true,
            body: mockStream,
          } as any);
        } else {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                candidates: [
                  {
                    content: {
                      parts: [
                        {
                          text: JSON.stringify({
                            sentiment_score: 0.8,
                            ai_summary: 'Feeling motivated and focused.',
                            sentiment: 'motivated',
                            burnoutScoreModifier: -10,
                            riskExplanation: 'Risk is low due to positive mood and good sleep.',
                            contributingFactors: ['Sufficient sleep'],
                            recommendations: {
                              study: ['Take breaks'],
                              mental: ['Breathe'],
                              physical: ['Stretch'],
                              sleep: ['Consistent schedule'],
                            },
                          }),
                        },
                      ],
                    },
                  },
                ],
              }),
          } as any);
        }
      }
      return originalFetch ? originalFetch(url, init) : Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Check-In API Route (/api/check-in)', () => {
    it('should return 400 if user_id is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/check-in', {
        method: 'POST',
        body: JSON.stringify({
          mood_score: 8,
          stress_level: 'Low',
          energy_level: 'High',
          sleep_hours: 7.5,
          study_hours: 6,
          primary_emotion: 'Calm',
        }),
      });

      const res = await checkInHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('user_id is required');
    });

    it('should return 400 on validation failure (mood score > 10)', async () => {
      const req = new NextRequest('http://localhost:3000/api/check-in', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'test-user-id',
          mood_score: 12, // Invalid
          stress_level: 'Low',
          energy_level: 'High',
          sleep_hours: 7.5,
          study_hours: 6,
          primary_emotion: 'Calm',
        }),
      });

      const res = await checkInHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid check-in details');
    });

    it('should successfully record check-in and return burnout calculations', async () => {
      const req = new NextRequest('http://localhost:3000/api/check-in', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'test-user-id',
          mood_score: 7,
          stress_level: 'Medium',
          energy_level: 'Medium',
          sleep_hours: 6.5,
          study_hours: 8,
          primary_emotion: 'Neutral',
          reflection: 'Studied for JEE, feeling slightly stressed.',
          triggers: ['Exam pressure', 'Lack of preparation'],
        }),
      });

      const res = await checkInHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.burnout).toBeDefined();
      expect(json.burnout.score).toBeGreaterThanOrEqual(0);
      expect(json.recommendations).toBeDefined();
    });

    it('should successfully run check-in analysis using Gemini when x-gemini-key is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/check-in', {
        method: 'POST',
        headers: {
          'x-gemini-key': 'AIzaSyTestKey123',
        },
        body: JSON.stringify({
          user_id: 'test-user-id',
          mood_score: 7,
          stress_level: 'Medium',
          energy_level: 'Medium',
          sleep_hours: 6.5,
          study_hours: 8,
          primary_emotion: 'Neutral',
          reflection: 'Studied for JEE, feeling slightly stressed.',
          triggers: ['Exam pressure'],
        }),
      });

      const res = await checkInHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.burnout).toBeDefined();
      expect(json.burnout.explanation).toContain('Risk is low due to positive mood');
    });
  });

  describe('Journal API Route (/api/journal)', () => {
    it('should return 400 if user_id is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/journal', {
        method: 'POST',
        body: JSON.stringify({
          content: 'I had a quiet day revising biology.',
        }),
      });

      const res = await journalHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('user_id is required');
    });

    it('should return 400 if content is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/journal', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'test-user-id',
          content: '',
        }),
      });

      const res = await journalHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Invalid journal content');
    });

    it('should successfully save journal and generate sentiment score', async () => {
      const req = new NextRequest('http://localhost:3000/api/journal', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 'test-user-id',
          content: 'I feel great today! Mock tests are going extremely well and I solved a lot of math questions.',
        }),
      });

      const res = await journalHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.journalEntry).toBeDefined();
    });

    it('should successfully run journal analysis using Gemini when x-gemini-key is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/journal', {
        method: 'POST',
        headers: {
          'x-gemini-key': 'AIzaSyTestKey123',
        },
        body: JSON.stringify({
          user_id: 'test-user-id',
          content: 'This is a reflection journal content.',
        }),
      });

      const res = await journalHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.journalEntry).toBeDefined();
    });
  });

  describe('AI Coach Chat API Route (/api/chat)', () => {
    it('should return 400 if messages list is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          context: {},
        }),
      });

      const res = await chatHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Messages array is required');
    });

    it('should successfully return streaming response text', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'I feel very anxious about NEET prep.' }],
          context: { primaryEmotion: 'Anxious', stressLevel: 'High', sleepHours: 5.5 },
        }),
      });

      const res = await chatHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/plain');
      
      const text = await res.text();
      expect(text.length).toBeGreaterThan(0);
    });

    it('should successfully stream response using Gemini when x-gemini-key is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'x-gemini-key': 'AIzaSyTestKey123',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'I feel very anxious about NEET prep.' }],
          context: { primaryEmotion: 'Anxious', stressLevel: 'High', sleepHours: 5.5 },
        }),
      });

      const res = await chatHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/plain');
      const text = await res.text();
      expect(text).toContain('Hello, I am CalmGuide. Let\'s manage your stress.');
    });
  });
});
