'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense, type KeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { MessageBubble } from '@/components/chatbot/message-bubble';
import { ConversationList } from '@/components/chatbot/conversation-list';
import { 
  Bot, 
  Send, 
  Trash2, 
  Loader2, 
  SlidersHorizontal 
} from 'lucide-react';
import { sendChatMessage, clearChatConversation } from '@/lib/api/client';
import type { ChatMessage } from '@/types';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I am TrafficSense AI, your real-time traffic intelligence assistant for Bangalore. I have live access to arterial corridor speeds, congestion forecasts via XGBoost, incident reports, and route alternatives across the city. How can I assist your commute or operations today?",
  timestamp: new Date().toISOString(),
};

function ChatInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = (messageText || input).trim();
      if (!text || isLoading) return;

      setInput('');

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      // Loading placeholder
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errorMessage}. Please check your connection and try again.`,
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

  // Auto-scroll on message updates
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  // If initialPrompt in URL query, automatically fire it after mount
  useEffect(() => {
    if (!initialPrompt) return;
    const timer = setTimeout(() => {
      handleSend(initialPrompt);
    }, 100);
    return () => clearTimeout(timer);
  }, [initialPrompt, handleSend]);

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
        // ignore
      }
    }
    setMessages([WELCOME_MESSAGE]);
    setConversationId(undefined);
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      setMessages((prev) => prev.filter((m) => !m.isError));
      handleSend(lastUser.content);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-8.5rem)] min-h-[600px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm flex bg-white dark:bg-slate-900">
      {/* LEFT: Conversation & Suggested Topics Drawer */}
      <div className={`hidden md:block transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
        <ConversationList
          conversationId={conversationId}
          onNewChat={handleClearConversation}
          onSelectPrompt={(p) => handleSend(p)}
          isLoading={isLoading}
        />
      </div>

      {/* MAIN: Chat Conversation Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-900/60">
        {/* Chat Window Header */}
        <div className="h-14 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex h-8 w-8 text-slate-500 hover:text-slate-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-none">
                  TrafficSense Assistant
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Amazon Bedrock • Tool-Calling Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearConversation}
              className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          </div>
        </div>

        {/* Messages Stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRetry={handleRetry}
            />
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Bangalore traffic speeds, predictions, routes, or incidents..."
              className="flex-1 resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none min-h-[38px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />

            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 mt-1.5">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="hidden sm:inline">Powered by AWS Bedrock Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <PageContainer
      title="AI Traffic Assistant"
      subtitle="Conversational assistant with tool access for live Bangalore traffic intelligence."
      className="pb-2"
    >
      <Suspense fallback={
        <div className="w-full h-[600px] bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }>
        <ChatInner />
      </Suspense>
    </PageContainer>
  );
}
