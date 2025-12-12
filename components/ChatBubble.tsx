import React from 'react';
import { ChatMessage, Role } from '../types';
import { IconBot, IconUser } from '../constants';

interface ChatBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string) => void;
  isPlaying?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onPlayAudio, isPlaying }) => {
  const isUser = message.role === Role.USER;

  // Basic formatting for code blocks and bold text
  const formatText = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); // Remove simple language identifier
        return (
          <pre key={index} className="bg-zinc-900 p-3 rounded-md my-2 overflow-x-auto border border-zinc-800 text-sm font-mono text-emerald-400">
            <code>{content}</code>
          </pre>
        );
      }
      
      // Inline formatting (bold)
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {boldParts.map((subPart, subIndex) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={subIndex} className="text-emerald-300 font-semibold">{subPart.slice(2, -2)}</strong>;
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {isUser ? <IconUser className="w-5 h-5 text-white" /> : <IconBot className="w-5 h-5 text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {message.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt="Uploaded" 
                  className="w-32 h-32 object-cover rounded-lg border border-zinc-700"
                />
              ))}
            </div>
          )}

          {/* Text Bubble */}
          <div className={`px-4 py-3 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed relative group ${
            isUser 
              ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm' 
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'
          }`}>
             {formatText(message.text)}
             
             {!isUser && onPlayAudio && (
               <div className="mt-2 pt-2 border-t border-zinc-800/50 flex justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => onPlayAudio(message.text)}
                   className={`text-xs flex items-center gap-1 hover:text-emerald-400 transition-colors ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`}
                   disabled={isPlaying}
                 >
                   {isPlaying ? (
                     <>
                       <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                       Falando...
                     </>
                   ) : (
                     <>
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                       Ouvir
                     </>
                   )}
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;