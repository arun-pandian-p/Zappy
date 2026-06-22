import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

export type TTSLanguage = 'en' | 'ta';

interface Announcement {
  id: string;
  textEn: string;
  textTa: string;
  repeat: boolean;
  type: 'order' | 'call';
}

export function useVoiceAnnouncement() {
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState<TTSLanguage>('en');
  const queueRef = useRef<Announcement[]>([]);
  const isSpeakingRef = useRef(false);
  const activeAnnouncementsRef = useRef<Map<string, Announcement>>(new Map());
  const { toast } = useToast();

  const toggleMute = () => setIsMuted((prev) => !prev);
  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'));

  const speakNext = useCallback(() => {
    if (isMuted || isSpeakingRef.current || queueRef.current.length === 0) return;

    const announcement = queueRef.current[0];
    isSpeakingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(
      language === 'ta' ? announcement.textTa : announcement.textEn
    );
    
    // Select Tamil voice if available, fallback to default
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

    utterance.onend = () => {
      isSpeakingRef.current = false;
      queueRef.current.shift(); // Remove the finished announcement
      
      // If it's a repeating announcement, we don't immediately push it back to the queue.
      // Instead, the 30s interval will re-evaluate pending activeAnnouncementsRef items and re-queue them.
      
      speakNext();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      isSpeakingRef.current = false;
      queueRef.current.shift();
      speakNext();
    };

    window.speechSynthesis.speak(utterance);
    
    // Show Toast
    toast({
      title: "Voice Announcement",
      description: language === 'ta' ? announcement.textTa : announcement.textEn,
    });
  }, [isMuted, language, toast]);

  // Handle playing when queue changes or unmuted
  useEffect(() => {
    if (!isMuted && !isSpeakingRef.current && queueRef.current.length > 0) {
      speakNext();
    }
  }, [isMuted, language, speakNext]);

  // 30-second repeat loop for pending items
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMuted) return;
      
      activeAnnouncementsRef.current.forEach((announcement) => {
        // Only push if it's not already in the queue
        if (!queueRef.current.some(a => a.id === announcement.id)) {
          queueRef.current.push({ ...announcement });
        }
      });
      
      if (!isSpeakingRef.current && queueRef.current.length > 0) {
        speakNext();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isMuted, speakNext]);

  const announce = useCallback((id: string, textEn: string, textTa: string, repeat: boolean, type: 'order' | 'call') => {
    // If it's not a repeating announcement (e.g. ready/served), just play it once
    if (!repeat) {
      queueRef.current.push({ id, textEn, textTa, repeat, type });
      if (!isSpeakingRef.current) speakNext();
      return;
    }

    // If it is repeating (pending order/call), track it.
    if (!activeAnnouncementsRef.current.has(id)) {
      const announcement = { id, textEn, textTa, repeat, type };
      activeAnnouncementsRef.current.set(id, announcement);
      queueRef.current.push(announcement);
      if (!isSpeakingRef.current) speakNext();
    }
  }, [speakNext]);

  const clearAnnouncement = useCallback((id: string) => {
    activeAnnouncementsRef.current.delete(id);
    // Remove from active queue if it hasn't spoken yet
    queueRef.current = queueRef.current.filter(a => a.id !== id);
  }, []);

  return {
    isMuted,
    toggleMute,
    language,
    toggleLanguage,
    announce,
    clearAnnouncement,
    activeAnnouncementsRef
  };
}
