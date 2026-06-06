import { NextResponse } from 'next/server';
import { isOpenAiConfigured } from '@/lib/openai';
import { getGeminiApiKey } from '@/lib/gemini';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseConfigured =
    !!supabaseUrl &&
    supabaseUrl !== 'https://placeholder-build-url.supabase.co' &&
    !supabaseUrl.includes('placeholder');

  const geminiKey = getGeminiApiKey();
  const geminiConfigured = !!geminiKey && geminiKey !== '';

  return NextResponse.json({
    openAiConfigured: isOpenAiConfigured(),
    geminiConfigured,
    supabaseConfigured,
  });
}
