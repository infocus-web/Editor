export type ProviderId = 'google' | 'openai' | 'stability' | 'replicate' | 'fal';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  badge: string;
  model: string;
  description: string;
  color: string;
  enabled: boolean;
}

export interface ProviderResultState {
  id: ProviderId;
  name: string;
  model: string;
  status: 'idle' | 'loading' | 'success' | 'error' | 'simulated';
  imageUrl?: string;
  executionTimeMs?: number;
  error?: string;
  notes?: string;
  winner?: boolean;
}

export interface UserApiKeys {
  google: string;
  openai: string;
  stability: string;
  replicate: string;
  fal: string;
}

export interface SamplePortrait {
  id: string;
  title: string;
  era: string;
  damage: string;
  url: string;
  recommendedPromptAddon?: string;
  fullPrompt: string;
  styleTag?: string;
}

export interface LightboxState {
  isOpen: boolean;
  providerId?: ProviderId;
  providerName?: string;
  modelName?: string;
  originalImage: string;
  restoredImage: string;
  zoom: number;
}

export interface RegionEditState {
  isOpen: boolean;
  providerId: ProviderId;
  providerName: string;
  image: string; // The regenerated image to be modified
}

export interface RegionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
