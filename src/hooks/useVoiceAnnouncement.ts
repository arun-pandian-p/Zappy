import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export type TTSLanguage = 'en' | 'ta';

interface Announcement {
  id: string;
  textEn: string;
  textTa: string;
  type: 'order' | 'call';
}

// Global module-level state to coordinate across all hook instances
const globalQueue: Announcement[] = [];
let isSpeakingGlobal = false;
let lastSpeakEndTime = 0;
const COOLDOWN_MS = 4000; // 4 seconds cooldown between announcements
const playedAnnouncementIds = new Set<string>();
let activeUtterance: SpeechSynthesisUtterance | null = null;
const globalStateListeners = new Set<() => void>();

function notifyGlobalStateListeners() {
  globalStateListeners.forEach(fn => fn());
}

function processQueue(language: TTSLanguage, toastFn: any) {
  if (globalQueue.length === 0) return;
  if (isSpeakingGlobal) return;

  const now = Date.now();
  const timeSinceLastEnd = now - lastSpeakEndTime;
  if (timeSinceLastEnd < COOLDOWN_MS) {
    const delay = COOLDOWN_MS - timeSinceLastEnd;
    setTimeout(() => processQueue(language, toastFn), delay);
    return;
  }

  const announcement = globalQueue[0];
  isSpeakingGlobal = true;
  notifyGlobalStateListeners();

  // Stop any active utterance to prevent overlap
  try {
    if (activeUtterance) {
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
    }
    window.speechSynthesis.cancel();
  } catch (e) {
    console.error('Error cancelling speech synthesis:', e);
  }

  const textToSpeak = language === 'ta' ? announcement.textTa : announcement.textEn;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);

  if (language === 'ta') {
    const voices = window.speechSynthesis.getVoices();
    const tamilVoice = voices.find((v) => v.lang.includes('ta'));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }
    utterance.lang = 'ta-IN';
  } else {
    utterance.lang = 'en-US';
  }

  const handleSpeechEnd = () => {
    isSpeakingGlobal = false;
    lastSpeakEndTime = Date.now();
    activeUtterance = null;
    
    // Remove the finished item from the queue
    const index = globalQueue.findIndex(a => a.id === announcement.id);
    if (index !== -1) {
      globalQueue.splice(index, 1);
    }
    notifyGlobalStateListeners();

    // Process next item after the cooldown
    setTimeout(() => processQueue(language, toastFn), COOLDOWN_MS);
  };

  utterance.onend = handleSpeechEnd;
  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    handleSpeechEnd();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);

  // Trigger Toast Notification
  toastFn({
    title: "Voice Announcement",
    description: textToSpeak,
  });
}

// Global settings
let isMutedGlobal = false;
let languageGlobal: TTSLanguage = 'en';

export function useVoiceAnnouncement() {
  const { toast } = useToast();
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    globalStateListeners.add(forceUpdate);
    return () => {
      globalStateListeners.delete(forceUpdate);
    };
  }, [forceUpdate]);

  const toggleMute = useCallback(() => {
    isMutedGlobal = !isMutedGlobal;
    if (isMutedGlobal) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      isSpeakingGlobal = false;
    }
    notifyGlobalStateListeners();
  }, []);

  const toggleLanguage = useCallback(() => {
    languageGlobal = languageGlobal === 'en' ? 'ta' : 'en';
    notifyGlobalStateListeners();
  }, []);

  const announce = useCallback((id: string, textEn: string, textTa: string, repeat: boolean, type: 'order' | 'call') => {
    if (isMutedGlobal) return;
    
    // Prevent duplicate playback: one event = one announcement
    if (playedAnnouncementIds.has(id)) {
      return;
    }
    playedAnnouncementIds.add(id);

    // Add to queue
    globalQueue.push({ id, textEn, textTa, type });
    notifyGlobalStateListeners();

    // Trigger queue processing
    processQueue(languageGlobal, toast);
  }, [toast]);

  const clearAnnouncement = useCallback((id: string) => {
    const index = globalQueue.findIndex(a => a.id === id);
    if (index !== -1) {
      globalQueue.splice(index, 1);
      notifyGlobalStateListeners();
    }
  }, []);

  return {
    isMuted: isMutedGlobal,
    toggleMute,
    language: languageGlobal,
    toggleLanguage,
    announce,
    clearAnnouncement,
    isSpeaking: isSpeakingGlobal,
    queue: globalQueue
  };
}
