import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Mic,
  MicOff,
  ShieldCheck
} from 'lucide-react';
import { groqAssistantService, type ChatMessage } from '../../services/groqAssistantService';
import { voiceService, type VoicePlaybackState } from '../../services/voiceService';
import { useAuth } from '../../context/AuthContext';

export const SevaSathiAIAssistant: React.FC = () => {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    user = null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoicePlaybackState>(voiceService.getState());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'MSG-INIT',
      role: 'assistant',
      content: `Hello! I am your **SevaSetu Healthcare & Blood Emergency Assistant**.
I can retrieve live blood-bank inventory, explain matching decisions, inspect near-expiry rescue units, and check campaign RSVP numbers.

How can I assist your clinical workflow today?`,
      timestamp: new Date().toISOString(),
      model: 'SevaSetu Clinical Intelligence',
    },
  ]);

  useEffect(() => {
    const unsub = voiceService.subscribe((state) => {
      setVoiceState(state);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `USER-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);
    setMicError(null);

    try {
      const reply = await groqAssistantService.sendMessage({
        prompt,
        conversationHistory: messages,
        userRole: user?.role || 'hospital',
        organizationId: user?.orgId,
      });

      setMessages((prev) => [...prev, reply]);

      // If voice enabled, speak the answer
      if (voiceEnabled) {
        // Strip markdown characters for clean speech synthesis
        const cleanText = reply.content
          .replace(/[#*`_>]/g, '')
          .replace(/\[.*?\]\(.*?\)/g, '')
          .slice(0, 350);
        voiceService.speak(cleanText);
      }
    } catch (err: any) {
      console.error('Failed to get AI assistant response', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next) {
      voiceService.stop();
    }
  };

  const handleSpeechInput = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setMicError(null);
    setIsRecording(true);

    voiceService.startSpeechRecognition(
      (transcript) => {
        setIsRecording(false);
        setInputPrompt(transcript);
        handleSend(transcript);
      },
      (error) => {
        setIsRecording(false);
        setMicError(error);
      }
    );
  };

  const handleQuickQuestion = (q: string) => {
    handleSend(q);
  };

  const quickQuestions = [
    'Which nearby blood banks have eligible O-negative inventory?',
    'Which of my blood units are expiring in less than 18 hours?',
    'Explain the current stockout risk for my facility',
    'How many donors have confirmed attendance for our campaign?',
    'Why is my emergency request still pending?',
  ];

  return (
    <>
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#C1272D] to-[#991B1B] text-white shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 border border-white/20 group"
          title="Open SevaSetu AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="font-bold text-xs tracking-wide">SevaSetu AI</span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">Groq</span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1E293B] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C1272D] to-rose-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-100">SevaSetu Assistant</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Data
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Role: <span className="text-slate-300 font-semibold uppercase">{user?.role || 'Guest'}</span> • Groq LLaMA-3.3
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleVoice}
                title={voiceEnabled ? 'Mute spoken audio' : 'Enable voice responses'}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled ? 'text-purple-400 bg-purple-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Playback Control Bar (Shown when speaking or paused) */}
          {voiceState.isPlaying || voiceState.isPaused ? (
            <div className="bg-purple-50 px-3 py-1.5 border-b border-purple-200 flex items-center justify-between text-xs text-purple-900 animate-in fade-in">
              <span className="flex items-center gap-1.5 font-medium text-[11px] truncate max-w-[220px]">
                <Volume2 className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>Reading response aloud...</span>
              </span>
              <div className="flex items-center gap-1">
                {voiceState.isPaused ? (
                  <button onClick={() => voiceService.resume()} className="p-1 text-purple-700 hover:bg-purple-200 rounded">
                    <Play className="w-3 h-3" />
                  </button>
                ) : (
                  <button onClick={() => voiceService.pause()} className="p-1 text-purple-700 hover:bg-purple-200 rounded">
                    <Pause className="w-3 h-3" />
                  </button>
                )}
                <button onClick={() => voiceService.stop()} className="p-1 text-purple-700 hover:bg-purple-200 rounded">
                  <Square className="w-3 h-3" />
                </button>
                <button onClick={() => voiceService.replay()} className="p-1 text-purple-700 hover:bg-purple-200 rounded">
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Mic error notice */}
          {micError && (
            <div className="bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 border-b border-amber-200 flex items-center justify-between">
              <span>{micError}</span>
              <button onClick={() => setMicError(null)} className="font-bold ml-2">&times;</button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl shadow-xs leading-relaxed space-y-1.5 ${
                      isUser
                        ? 'bg-[#C1272D] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {/* Render message text with basic markdown formatting */}
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.content}
                    </div>

                    {/* Tool Execution Badge */}
                    {msg.executedTool && (
                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          Tool: {msg.executedTool}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                      <span>{msg.model || 'SevaSetu AI'}</span>
                      <button
                        onClick={() => voiceService.speak(msg.content.replace(/[#*`_>]/g, '').slice(0, 300))}
                        className="hover:text-purple-600 flex items-center gap-0.5"
                        title="Read this message aloud"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>Listen</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-2 bg-white p-3 rounded-2xl border border-slate-200 max-w-[200px]">
                <Bot className="w-4 h-4 text-[#C1272D] animate-spin" />
                <span className="animate-pulse">Inspecting live records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Suggestions */}
          <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-[#C1272D] text-slate-600 whitespace-nowrap transition-colors shrink-0"
              >
                {q.length > 32 ? q.substring(0, 30) + '...' : q}
              </button>
            ))}
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeechInput}
              title={isRecording ? 'Listening... click to stop' : 'Speak your question'}
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isRecording ? 'Listening to speech...' : 'Ask about inventory, requests, expiry, or campaigns...'}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C1272D] bg-slate-50 focus:bg-white"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2 rounded-xl bg-[#C1272D] hover:bg-[#A01F24] text-white disabled:opacity-40 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
