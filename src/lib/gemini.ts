export const GEMINI_MODEL = 'gemini-1.5-flash';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

// Helper to determine if a Gemini key is configured
export function getGeminiApiKey(clientHeaderKey?: string | null): string {
  const key = clientHeaderKey || process.env.GEMINI_API_KEY || '';
  return key.trim();
}

export async function generateGeminiContent(
  apiKey: string,
  systemInstruction: string,
  promptText: string,
  jsonMode: boolean = false
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: promptText }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.7,
      responseMimeType: jsonMode ? 'application/json' : 'text/plain',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

export async function* streamGeminiContent(
  apiKey: string,
  systemInstruction: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): AsyncGenerator<string, void, unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Format history for Gemini
  // Gemini expects roles: 'user' or 'model'
  const contents = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini streaming error: ${response.statusText} - ${errText}`);
  }

  if (!response.body) {
    throw new Error('No response body returned from Gemini.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const jsonStr = trimmed.slice(6);
        if (jsonStr === '[DONE]') continue;

        const data = JSON.parse(jsonStr);
        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (textChunk) {
          yield textChunk;
        }
      } catch (err) {
        // Ignore parsing errors for partial lines
      }
    }
  }
}
