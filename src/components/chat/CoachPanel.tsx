'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWellness } from '../layout/WellnessProvider';
import { ChatMessage } from '@/types';
import { Send, Sparkles, BrainCircuit, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';

interface CoachPanelProps {
  latestEmotion?: string;
  latestStress?: string;
  latestSleep?: number;
}

export function CoachPanel({ latestEmotion, latestStress, latestSleep }: CoachPanelProps) {
  const { geminiKey } = useWellness();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm CalmGuide, your personal wellness coach. I'm here to listen, help you manage exam stress, and share coping strategies. How are you feeling about your studies today?",
      created_at: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setAiConfigured(!!data.openAiConfigured || !!data.geminiConfigured))
      .catch((err) => console.error('Error fetching api config status:', err));
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm CalmGuide. Let's restart. How can I help you support your mental wellness and study balance today?",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMsgText = inputMessage.trim();
    setInputMessage('');

    // 1. Create and add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMsgText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Prepare streaming state
    const assistantMsgId = crypto.randomUUID();
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newAssistantMsg]);

    try {
      // 3. Post chat payload to endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey || '',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: {
            primaryEmotion: latestEmotion || 'Neutral',
            stressLevel: latestStress || 'Medium',
            sleepHours: latestSleep || 7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response.');
      }

      if (!response.body) {
        throw new Error('No response body returned.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      // 4. Stream reader loop
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: !done });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }
    } catch (err) {
      console.error('Error streaming chat:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "I'm sorry, I'm having trouble connecting to my service right now. Please verify your connection or try again. Remember, if you are feeling very overwhelmed, you can call one of the student support hotlines listed in the footer.",
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm flex flex-col h-[520px] transition-colors duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1">
              CalmGuide Coach
              <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/10 animate-pulse-slow" />
            </h3>
            <p className="text-[10px] text-muted-foreground">Empathetic Wellness Support</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
          title="Reset conversation"
          aria-label="Reset conversation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2 text-[10px] text-muted-foreground mt-3.5 animate-in fade-in duration-300">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Safety Disclaimer:</span> CalmGuide is an AI wellness companion, not a medical device or licensed therapist. I cannot diagnose conditions or replace clinical professional support.
        </div>
      </div>

      {/* AI Key Missing Warning (automatically triggers fallback) */}
      {aiConfigured === false && !geminiKey && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex gap-2 text-[10px] text-muted-foreground mt-2 animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Local Fallback Active:</span> API Key is missing. CalmGuide is running on local rules-based simulation. Add your Gemini API Key in Session Settings or set <code>GEMINI_API_KEY</code> / <code>OPENAI_API_KEY</code> to enable generative AI.
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1" role="log" aria-label="Chat Message Logs">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed transition-all duration-300 ${
                  isUser
                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                    : 'bg-secondary text-card-foreground rounded-tl-none border border-border/20'
                }`}
              >
                {msg.content || (
                  <span className="flex items-center gap-1 py-1">
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-tl-none border border-border/20 px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1 py-1">
                <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-border/40 pt-3 flex gap-2">
        <input
          type="text"
          placeholder="Ask CalmGuide for coping strategies or study routine tips..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isTyping}
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={isTyping || !inputMessage.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  );
}
export default CoachPanel;
