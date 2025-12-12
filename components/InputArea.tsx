import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { IconSend, IconImage, IconX } from '../constants';

interface InputAreaProps {
  onSend: (text: string, images: string[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && images.length === 0) || isLoading) return;
    onSend(text, images);
    setText('');
    setImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Image Preview */}
      {images.length > 0 && (
        <div className="flex gap-3 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 rounded-full p-0.5 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <IconX className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg transition-all focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte qualquer coisa ao Gemini..."
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 px-4 py-4 pr-24 rounded-3xl resize-none outline-none max-h-[120px] overflow-y-auto"
          rows={1}
          disabled={isLoading}
        />
        
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full transition-colors"
            title="Adicionar imagens"
            disabled={isLoading}
          >
            <IconImage className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleSend}
            disabled={(!text.trim() && images.length === 0) || isLoading}
            className={`p-2 rounded-full transition-all ${
              (!text.trim() && images.length === 0) || isLoading
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/20'
            }`}
          >
            <IconSend className="w-5 h-5" />
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          multiple 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
};

export default InputArea;