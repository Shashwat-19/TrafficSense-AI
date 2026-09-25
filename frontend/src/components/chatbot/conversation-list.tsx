'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MapPin, 
  CloudRain, 
  Route, 
  AlertTriangle,
  BarChart2,
  HelpCircle
} from 'lucide-react';

interface ConversationListProps {
  conversationId?: string;
  onNewChat: () => void;
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
}

const SUGGESTED_TOPICS = [
  { 
    label: 'Traffic on ORR', 
    prompt: 'How is traffic on Outer Ring Road (Marathahalli & Bellandur) right now?', 
    icon: MapPin 
  },
  { 
    label: 'Route to Airport', 
    prompt: 'Find the fastest route from Koramangala to Kempegowda Airport with minimum delay.', 
    icon: Route 
  },
  { 
    label: 'Weather & Roads', 
    prompt: 'What is the current Bangalore weather and how is it impacting traffic velocity?', 
    icon: CloudRain 
  },
  { 
    label: "Today's Incidents", 
    prompt: 'Are there any major accidents or road closures reported in Bangalore today?', 
    icon: AlertTriangle 
  },
  { 
    label: 'Traffic Analytics', 
    prompt: 'What are the top 3 most congested bottlenecks in Bangalore right now?', 
    icon: BarChart2 
  },
  { 
    label: 'Help & Examples', 
    prompt: 'What tools and live traffic intelligence can you access for Bangalore?', 
    icon: HelpCircle 
  },
];

export function ConversationList({
  conversationId,
  onNewChat,
  onSelectPrompt,
  isLoading,
}: ConversationListProps) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-slate-50/70 dark:bg-slate-900/40 border-r border-slate-200/80 dark:border-slate-800 space-y-4">
      <div className="space-y-4">
        {/* New Chat Button */}
        <Button
          onClick={onNewChat}
          disabled={isLoading}
          className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Conversation</span>
        </Button>

        {/* Active Session Status */}
        {conversationId && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Active Context
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold truncate">
                {conversationId.slice(0, 12)}...
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        )}

        {/* Suggested Queries */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
            Suggested Prompts
          </span>
          <div className="space-y-1">
            {SUGGESTED_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.label}
                  onClick={() => onSelectPrompt(topic.prompt)}
                  disabled={isLoading}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 group"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                  <span className="font-medium truncate">{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Model Spec Footer */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">Amazon Bedrock</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
        <p className="text-[10px] text-slate-400">
          Claude 3.5 Sonnet with Tool-Calling
        </p>
      </div>
    </div>
  );
}
