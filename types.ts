export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  images?: string[]; // Base64 strings
  isThinking?: boolean; // If true, this is a thinking process block (optional UI feature)
  timestamp: number;
}

export interface ModelConfig {
  modelId: string;
  name: string;
  description: string;
  supportsImages: boolean;
  supportsThinking: boolean;
  maxThinkingBudget?: number;
}

export enum GeminiModelId {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  FLASH_LITE = 'gemini-flash-lite-latest'
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModelId: string;
  thinkingEnabled: boolean;
}