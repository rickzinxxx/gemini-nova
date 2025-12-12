import React, { useState } from 'react';
import GeminiChat from './components/GeminiChat';
import ScrollHeroDemo from './components/ScrollHeroDemo';

const App: React.FC = () => {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return <GeminiChat />;
  }

  return <ScrollHeroDemo onStartChat={() => setShowChat(true)} />;
};

export default App;