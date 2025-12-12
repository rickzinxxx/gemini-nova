import React from 'react';
import ScrollExpandMedia from './ui/scroll-expansion-hero';

interface MediaContentProps {
  onStartChat: () => void;
}

const MediaContent = ({ onStartChat }: MediaContentProps) => {
  return (
    <div className='max-w-4xl mx-auto text-center'>
      <h2 className='text-3xl font-bold mb-6 text-zinc-100'>
        Experimente o Gemini Nova
      </h2>
      <p className='text-lg mb-8 text-zinc-300 leading-relaxed'>
        O Gemini Nova não é apenas um chatbot; é uma janela para o futuro da IA. 
        Com raciocínio avançado, capacidades multimodais e respostas ultrarrápidas, 
        ele foi projetado para aumentar sua criatividade e produtividade.
        Ao rolar a página, observe como o horizonte se expande — assim como suas possibilidades com o Gemini.
      </p>

      <p className='text-lg mb-12 text-zinc-300'>
        Pronto para explorar o universo do conhecimento?
      </p>

      <button 
        onClick={onStartChat}
        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-semibold rounded-full shadow-lg shadow-emerald-900/40 transition-all hover:scale-105"
      >
        Iniciar Chat
      </button>
    </div>
  );
};

interface ScrollHeroDemoProps {
    onStartChat: () => void;
}

const ScrollHeroDemo: React.FC<ScrollHeroDemoProps> = ({ onStartChat }) => {
  // Video: Space Nebula
  const videoSrc = 'https://cdn.coverr.co/videos/coverr-space-nebula-5364/1080p.mp4'; 
  const videoPoster = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop';
  const bgSrc = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop';

  return (
    <div className='min-h-screen bg-black'>
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc={videoSrc}
        posterSrc={videoPoster}
        bgImageSrc={bgSrc}
        title="GEMINI NOVA"
        date="IA REIMAGINADA"
        scrollToExpand="Role para Inicializar"
        textBlend={true}
      >
        <MediaContent onStartChat={onStartChat} />
      </ScrollExpandMedia>
    </div>
  );
};

export default ScrollHeroDemo;