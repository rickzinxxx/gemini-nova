import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { ChatMessage, Role, GeminiModelId, ChatState } from '../types';
import { MODELS, IconSparkles, IconTrash, IconBrain } from '../constants';
import { generateContentStream, generateSpeech } from '../services/geminiService';
import ChatBubble from './ChatBubble';
import InputArea from './InputArea';
import { WebGLShader } from './ui/web-gl-shader';
import { SplineScene } from './ui/spline';
import { Card } from './ui/card';

const GeminiChat: React.FC = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    selectedModelId: GeminiModelId.FLASH,
    thinkingEnabled: false
  });
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const clearChat = () => {
    setState(prev => ({
      ...prev,
      messages: [] 
    }));
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
        const audioBuffer = await generateSpeech(text);
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        
        // Ensure context is running (fixes autoplay policy issues)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        
        const ctx = audioContextRef.current;
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlayingAudio(false);
        source.start();
        
    } catch (e) {
        console.error("Audio playback failed", e);
        setIsPlayingAudio(false);
    }
  };

  const handleSend = async (text: string, images: string[]) => {
    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      images: images,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true
    }));

    try {
      // 2. Prepare Placeholder for Model Response
      const modelMsgId = (Date.now() + 1).toString();
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: modelMsgId,
          role: Role.MODEL,
          text: '', // Start empty
          timestamp: Date.now()
        }]
      }));

      // 3. Call API
      const stream = await generateContentStream(
        state.messages, // History *before* current user msg
        text,
        images,
        MODELS[state.selectedModelId],
        state.thinkingEnabled
      );

      // 4. Consume Stream
      let fullText = '';
      
      for await (const chunk of stream) {
        const chunkResponse = chunk as GenerateContentResponse;
        const chunkText = chunkResponse.text;
        
        if (chunkText) {
            fullText += chunkText;
            
            // Update last message with accumulated text
            setState(prev => {
                const newMessages = [...prev.messages];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0) {
                    newMessages[lastIdx] = {
                        ...newMessages[lastIdx],
                        text: fullText
                    };
                }
                return { ...prev, messages: newMessages };
            });
        }
      }

    } catch (error) {
      console.error("Stream error", error);
      setState(prev => {
        const msgs = [...prev.messages];
        // Append error to last message or create new error message
        const lastIdx = msgs.length - 1;
        const errorText = "\n\n[Erro: Não foi possível gerar a resposta. Verifique sua chave de API ou conexão.]";
        
        if (lastIdx >= 0 && msgs[lastIdx].role === Role.MODEL) {
            msgs[lastIdx].text += errorText;
        } else {
            msgs.push({
                id: Date.now().toString(),
                role: Role.MODEL,
                text: errorText,
                timestamp: Date.now()
            });
        }
        
        return { ...prev, messages: msgs };
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const toggleModel = (modelId: string) => {
    setState(prev => ({ ...prev, selectedModelId: modelId }));
  };

  // Determine avatar state for visual effects
  const isAvatarActive = state.isLoading || isPlayingAudio;

  return (
    <div className="relative flex flex-col h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      
      {/* Background WebGL Shader */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <WebGLShader className="absolute inset-0 w-full h-full opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="flex-none p-4 border-b border-zinc-800 bg-black/50 backdrop-blur-md z-10">
            <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <IconSparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent hidden sm:block">
                Gemini Nova
                </h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Thinking Toggle */}
                <button
                onClick={() => setState(prev => ({...prev, thinkingEnabled: !prev.thinkingEnabled}))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    state.thinkingEnabled 
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' 
                    : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                }`}
                title="Ativar raciocínio estendido (Thinking Budget)"
                >
                <IconBrain className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Raciocínio</span>
                <div className={`w-2 h-2 rounded-full ${state.thinkingEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-700'}`} />
                </button>

                {/* Model Selector */}
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button
                    onClick={() => toggleModel(GeminiModelId.FLASH)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    state.selectedModelId === GeminiModelId.FLASH
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Flash
                </button>
                <button
                    onClick={() => toggleModel(GeminiModelId.PRO)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    state.selectedModelId === GeminiModelId.PRO
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Pro
                </button>
                </div>

                <button 
                onClick={clearChat}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                title="Limpar Chat"
                >
                <IconTrash className="w-4 h-4" />
                </button>
            </div>
            </div>
        </header>

        {/* Main Content Area (Mobile: Stacked, Desktop: Side-by-Side) */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-7xl mx-auto w-full">
            
            {/* Avatar Section: Top on Mobile, Right Side on Desktop */}
            <div className={`
                flex-none lg:flex-initial 
                w-full lg:w-[350px] xl:w-[400px] 
                h-[25vh] lg:h-auto 
                order-1 lg:order-2 
                border-b lg:border-b-0 lg:border-l border-zinc-800/50 
                bg-black/20 backdrop-blur-sm 
                relative z-20
                flex flex-col
            `}>
                <div className="absolute inset-0 lg:relative lg:inset-auto lg:h-full lg:p-4 w-full h-full">
                   <div className="w-full h-full lg:h-[400px] lg:aspect-square relative overflow-hidden lg:rounded-3xl lg:bg-zinc-900/20 lg:border lg:border-zinc-800/50">
                        {/* Status Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none transition-opacity duration-500 ${isAvatarActive ? 'opacity-100' : 'opacity-0'}`} />
                        
                        {/* Audio Visualizer Overlay */}
                        {isPlayingAudio && (
                           <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-1.5 z-30 pointer-events-none">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div 
                                  key={i} 
                                  className="w-1.5 bg-emerald-400 rounded-full animate-pulse" 
                                  style={{ 
                                    height: `${Math.random() * 20 + 10}px`,
                                    animationDuration: `${0.4 + Math.random() * 0.4}s` 
                                  }} 
                                />
                              ))}
                           </div>
                        )}

                        <SplineScene 
                            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                            className="w-full h-full"
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 lg:bottom-4 lg:top-auto lg:left-0 lg:right-0 lg:text-center pointer-events-none">
                             <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] lg:text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md border shadow-lg ${
                                 isPlayingAudio ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' :
                                 state.isLoading ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' :
                                 'bg-zinc-900/80 border-zinc-700 text-zinc-500'
                             }`}>
                                 {isPlayingAudio ? 'Falando' : state.isLoading ? 'Pensando' : 'Online'}
                                 <span className={`w-1.5 h-1.5 rounded-full ${isAvatarActive ? 'bg-current animate-ping' : 'bg-green-500/50'}`} />
                             </span>
                        </div>
                   </div>
                   
                   {/* Desktop Stats (Hidden on mobile to save space) */}
                   <div className="hidden lg:block mt-6 px-4">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wider text-xs">Status do Sistema</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Modelo Ativo</span>
                                <span className="text-zinc-300 font-mono">{state.selectedModelId}</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Modo Raciocínio</span>
                                <span className={state.thinkingEnabled ? "text-indigo-400" : "text-zinc-600"}>{state.thinkingEnabled ? 'ATIVO' : 'STANDBY'}</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Síntese de Voz</span>
                                <span className={isPlayingAudio ? "text-emerald-400 animate-pulse" : "text-zinc-600"}>{isPlayingAudio ? 'ATIVA' : 'PRONTA'}</span>
                            </div>
                        </div>
                   </div>
                </div>
            </div>

            {/* Chat History Section */}
            <div className="flex-1 order-2 lg:order-1 flex flex-col min-w-0 overflow-y-auto scroll-smooth p-4 relative h-full">
                <div className="max-w-3xl mx-auto w-full pt-4 pb-4 h-full">
                    {state.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                             <h2 className="text-2xl font-bold mb-4 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">Bem-vindo ao Gemini Nova</h2>
                             <p className="text-zinc-400 max-w-md text-sm lg:text-base">Eu sou seu assistente virtual multimodal. Posso ver imagens, raciocinar sobre problemas complexos e falar com você.</p>
                        </div>
                    ) : (
                        <>
                        {state.messages.map((msg) => (
                            <ChatBubble 
                                key={msg.id} 
                                message={msg} 
                                onPlayAudio={handlePlayAudio}
                                isPlaying={isPlayingAudio && msg.text.length > 0 /* Crude check, ideally track ID */} 
                            />
                        ))}
                        
                        {/* Loading Indicator */}
                        {state.isLoading && state.messages.length > 0 && state.messages[state.messages.length - 1].role === Role.USER && (
                            <div className="flex items-center gap-2 text-zinc-500 text-sm ml-12 animate-pulse mt-4">
                                <IconSparkles className="w-4 h-4" />
                                <span>Gemini está pensando...</span>
                            </div>
                        )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

        </main>

        {/* Footer Input */}
        <footer className="flex-none p-4 bg-gradient-to-t from-black via-black to-transparent z-30 border-t border-zinc-800/30">
            <InputArea onSend={handleSend} isLoading={state.isLoading} />
            <div className="text-center mt-2">
                <p className="text-[10px] text-zinc-600">
                    O Gemini pode exibir informações imprecisas, inclusive sobre pessoas, por isso verifique suas respostas.
                </p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default GeminiChat;