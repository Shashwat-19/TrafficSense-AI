'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Map, 
  Brain, 
  Route, 
  RotateCcw, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolResult } from './tool-result';
import type { ChatMessage } from '@/types';
import { formatTimestamp } from '@/lib/congestion';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Detect corridor mentions in assistant response to provide smart quick actions
  const containsTraffic = !isUser && (
    message.tools_used?.some(t => t.includes('traffic') || t.includes('prediction')) ||
    message.content.toLowerCase().includes('outer ring road') ||
    message.content.toLowerCase().includes('silk board') ||
    message.content.toLowerCase().includes('congestion') ||
    message.content.toLowerCase().includes('speed')
  );

  return (
    <div className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Message Content Container */}
      <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs font-normal'
              : message.isError
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-tl-xs'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs shadow-xs'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 py-1">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Querying Bangalore live sensors & models...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="whitespace-pre-wrap break-words text-[13.5px]">
                {message.content}
              </div>

              {/* Tools execution telemetry */}
              {message.tools_used && message.tools_used.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <ToolResult toolsUsed={message.tools_used} />
                </div>
              )}

              {message.isError && onRetry && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-7 text-xs gap-1.5 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Retry Request</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Smart contextual action buttons beneath assistant response */}
        {!isUser && !message.isLoading && !message.isError && containsTraffic && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pl-1">
            <Link href="/map">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 shadow-2xs hover:bg-slate-50"
              >
                <Map className="h-3 w-3 text-blue-600" />
                <span>View on Map</span>
              </Button>
            </Link>

            <Link href="/predictions">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 shadow-2xs hover:bg-slate-50"
              >
                <Brain className="h-3 w-3 text-indigo-600" />
                <span>Check Predictions</span>
              </Button>
            </Link>

            <Link href="/routes">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 shadow-2xs hover:bg-slate-50"
              >
                <Route className="h-3 w-3 text-emerald-600" />
                <span>Find Route</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Message timestamp */}
        <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
            You
          </div>
        </div>
      )}
    </div>
  );
}
