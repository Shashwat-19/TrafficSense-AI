'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  User,
  Send,
  Trash2,
  RotateCcw,
  Sparkles,
  MapPin,
  CloudRain,
  AlertTriangle,
  Route,
  Loader2,
} from 'lucide-react';
import { sendChatMessage, clearChatConversation } from '@/lib/api/client';
import type { ChatMessage } from '@/types';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your TrafficSense AI assistant. I can help you with live traffic conditions, congestion predictions, incidents, weather, routes, and traffic analytics for Bangalore. Ask me anything!",
  timestamp: new Date().toISOString(),
};

const QUICK_ACTIONS = [
  { label: 'Current traffic in Bangalore', icon: MapPin },
  { label: 'Traffic on Outer Ring Road', icon: MapPin },
  { label: 'Traffic prediction for 30 minutes', icon: Sparkles },
  { label: 'Major incidents', icon: AlertTriangle },
  { label: 'Weather and traffic', icon: CloudRain },
  { label: 'Find a less congested route from Koramangala to Whitefield', icon: Route },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = (messageText || input).trim();
      if (!text || isLoading) return;

      setInput('');
      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      // Add loading placeholder
      const loadingMsg: ChatMessage = {
        id: `loading-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setIsLoading(true);

      try {
        const response = await sendChatMessage(text, conversationId);

        if (!conversationId) {
          setConversationId(response.conversation_id);
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: response.timestamp,
          sources: response.sources,
          tools_used: response.tools_used,
          actions: response.actions,
        };

        setMessages((prev) => [
          ...prev.filter((m) => !m.isLoading),
          assistantMsg,
        ]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);

        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errorMessage}. Please try again.`,
          timestamp: new Date().toISOString(),
          isError: true,
        };

        setMessages((prev) => [
          ...prev.filter((m) => !m.isLoading),
          errorMsg,
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, conversationId]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearConversation = async () => {
    if (conversationId) {
      try {
        await clearChatConversation(conversationId);
      } catch {
        // ignore cleanup errors
      }
    }
    setMessages([WELCOME_MESSAGE]);
    setConversationId(undefined);
    setError(null);
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove the error message
      setMessages((prev) => prev.filter((m) => !m.isError));
      handleSend(lastUserMsg.content);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] pt-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Ask about traffic, routes, incidents, weather, and predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conversationId && (
            <Badge variant="outline" className="text-xs font-mono">
              {conversationId.slice(0, 8)}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            className="gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <CardContent className="flex-1 p-0 min-h-0">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.isError
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-muted'
                  }`}
                >
                  {msg.isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                      {msg.tools_used && msg.tools_used.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.tools_used.map((tool, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tool.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {msg.isError && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRetry}
                          className="mt-2 gap-1 h-7 text-xs"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>

        {/* Quick Actions (shown only when no user messages) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1"
                  onClick={() => handleSend(action.label)}
                  disabled={isLoading}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about traffic, routes, incidents..."
              className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
