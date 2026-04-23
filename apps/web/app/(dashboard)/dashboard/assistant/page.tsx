'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, BarChart3, Sparkles } from 'lucide-react';
import { askFinancialQuestion, type AssistantResponse } from '@/lib/assistant/actions';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  data?: { label: string; value: number }[];
  type?: AssistantResponse['type'];
  suggestions?: string[];
  timestamp: Date;
}

const QUICK_SUGGESTIONS = [
  'Omzet dit kwartaal',
  'Openstaande facturen',
  'BTW overzicht',
  'Uren deze week',
  'Uitgaven deze maand',
  'Winst dit jaar',
];

function MiniChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="mt-3 h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tickFormatter={(v) => `\u20AC${v}`}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            width={60}
          />
          <Tooltip
            formatter={(value: any) => formatCurrency(Number(value))}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" fill="oklch(0.65 0.25 250)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataList({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="mt-3 space-y-2">
      {data.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
        >
          <span className="text-sm">{item.label}</span>
          <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hallo! Ik ben je financieel assistent. Stel me een vraag over je omzet, facturen, uitgaven, BTW of uren.',
      type: 'text',
      suggestions: QUICK_SUGGESTIONS,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askFinancialQuestion(question);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        data: response.data,
        type: response.type,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'Er is een fout opgetreden. Probeer het opnieuw.',
          type: 'text',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Financieel Assistent</h1>
          <p className="text-sm text-muted-foreground">
            Stel vragen over je omzet, facturen, uitgaven en meer
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3'
                  : ''
              }`}
            >
              {msg.role === 'assistant' ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{msg.text}</p>

                    {msg.data && msg.type === 'chart' && <MiniChart data={msg.data} />}
                    {msg.data && msg.type === 'list' && <DataList data={msg.data} />}

                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.suggestions.map((sug) => (
                          <button
                            key={sug}
                            onClick={() => handleSend(sug)}
                            disabled={loading}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm">{msg.text}</p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Even kijken...
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4 pb-2">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel een vraag... bijv. 'Hoeveel omzet heb ik dit kwartaal?'"
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            size="icon"
            aria-label="Versturen"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_SUGGESTIONS.slice(0, 4).map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
