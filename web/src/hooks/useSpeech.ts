import { useState, useRef, useCallback } from 'react';

export type SpeechStatus = 'idle' | 'listening' | 'processing' | 'error';

export function useSpeech(onResult: (transcript: string) => void) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Voice recognition not supported in this browser. Try Chrome.');
      setStatus('error');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN'; // Indian English — also picks up Hindi accents
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setStatus('listening');
    rec.onerror = (e: any) => {
      setError(e.error === 'not-allowed' ? 'Microphone access denied.' : `Error: ${e.error}`);
      setStatus('error');
    };
    rec.onend = () => {
      if (status === 'listening') setStatus('idle');
    };
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setStatus('processing');
      onResult(transcript);
      setStatus('idle');
    };

    recognitionRef.current = rec;
    rec.start();
    setError(null);
  }, [isSupported, onResult, status]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus('idle');
  }, []);

  return { status, error, isSupported, start, stop };
}
