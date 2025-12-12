import { GoogleGenAI, Content, Part } from "@google/genai";
import { ChatMessage, Role, ModelConfig } from '../types';

let genAI: GoogleGenAI | null = null;

const getGenAI = (): GoogleGenAI => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key not found in environment variables.");
      throw new Error("Gemini API Key is missing.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// --- Audio Decoding Utilities (PCM to AudioBuffer) ---
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const ai = getGenAI();
  
  // Clean text: remove markdown characters that shouldn't be spoken
  // Regex removes: asterisks, hashes, backticks, underscores, brackets
  let cleanText = text.replace(/[\*#`_\[\]]/g, '').trim();

  // If cleaning resulted in empty string (e.g. text was just "**" or formatting), 
  // check if original text had content. If so, fallback to original text.
  if (!cleanText && text.trim().length > 0) {
      cleanText = text.trim();
  }

  if (!cleanText) {
      // If still empty, it means there is no content to speak.
      throw new Error("Text is empty after cleaning.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ["AUDIO"], // Use string literal for safety
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Options: Puck, Charon, Kore, Fenrir, Zephyr
            },
        },
      },
    });

    const firstCandidate = response.candidates?.[0];
    const firstPart = firstCandidate?.content?.parts?.[0];

    // Check if the model refused and returned text instead of audio
    if (firstPart?.text) {
        console.warn("Gemini TTS returned text instead of audio:", firstPart.text);
        throw new Error(`Gemini refused to generate audio: ${firstPart.text}`);
    }

    const base64Audio = firstPart?.inlineData?.data;
    
    if (!base64Audio) {
      console.error("Gemini TTS response structure invalid:", response);
      throw new Error("No audio data returned from Gemini.");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      outputAudioContext,
      24000,
      1,
    );

    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

export const generateContentStream = async (
  history: ChatMessage[],
  newMessage: string,
  images: string[], // Base64
  modelConfig: ModelConfig,
  thinkingEnabled: boolean
) => {
  const ai = getGenAI();
  
  // Transform app history to Gemini Content format
  const contents: Content[] = history.map((msg) => {
    const parts: Part[] = [{ text: msg.text }];
    return {
      role: msg.role,
      parts: parts
    };
  });

  // Construct current message parts
  const currentParts: Part[] = [];
  
  // Add images if any
  if (images.length > 0) {
    images.forEach(base64Data => {
      const cleanBase64 = base64Data.split(',')[1]; 
      const mimeType = base64Data.substring(base64Data.indexOf(':') + 1, base64Data.indexOf(';'));
      
      currentParts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64
        }
      });
    });
  }

  currentParts.push({ text: newMessage });

  // Add current message to contents
  contents.push({
    role: Role.USER,
    parts: currentParts
  });

  // Configure Model
  const config: any = {};
  
  if (thinkingEnabled && modelConfig.supportsThinking) {
    config.thinkingConfig = {
        thinkingBudget: modelConfig.maxThinkingBudget || 1024
    };
  }

  try {
    const result = await ai.models.generateContentStream({
      model: modelConfig.modelId,
      contents: contents,
      config: config
    });

    return result;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};