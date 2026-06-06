import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

if (!apiKey) {
  console.warn(
    'OPENAI_API_KEY is not defined. AI integrations will use simulated responses if mock mode is active.'
  );
}

export const openai = new OpenAI({
  apiKey: apiKey || 'mock-key', // Avoid crashing during initialization if key is not set
});

// A helper function to check if OpenAI is configured, to fallback to high-quality mock data during testing if needed
export const isOpenAiConfigured = () => {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key';
};
