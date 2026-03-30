import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, language }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const stopAssistant = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    setIsModelSpeaking(false);
    setTranscript('');
  };

  const startAssistant = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            source.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
            
            processorRef.current!.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              sessionRef.current.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const base64Audio = part.inlineData.data;
                  const binary = atob(base64Audio);
                  const bytes = new Uint8Array(binary.length);
                  for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  audioQueueRef.current.push(pcmData);
                  if (!isPlayingRef.current) {
                    playNextChunk();
                  }
                }
              }
            }
            
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setIsModelSpeaking(false);
            }

            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscript(prev => prev + ' ' + message.serverContent?.modelTurn?.parts?.[0]?.text);
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            stopAssistant();
          },
          onclose: () => {
            stopAssistant();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are a friendly, human-like Agricultural Intelligence Assistant. You are a friend to the farmer. Respond in ${language}. 

TONE & STYLE:
1. Friendly & Conversational: Use warm greetings like "Hello my friend!", "How's the farm today?", "I'm here for you."
2. Proactive: Don't just answer questions. Ask how the farmer is doing, or how the weather is in their region.
3. Multilingual: Respond fully and naturally in ${language}. If the user says "hii hello", respond with "Hello! How are you? How can I help you today, my friend?".
4. Empathetic: If there's a problem, show you care. "I'm sorry to hear about your crops, but don't worry, we'll fix this together."

Keep your answers concise but warm and helpful. You are part of PlantDoc AI.`,
        },
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error("Failed to start voice assistant:", err);
      setError("Could not access microphone or connect to AI.");
      setIsConnecting(false);
    }
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      setIsModelSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsModelSpeaking(true);
    const pcmData = audioQueueRef.current.shift()!;
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }

    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 16000);
    buffer.getChannelData(0).set(floatData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => playNextChunk();
    source.start();
  };

  useEffect(() => {
    if (!isOpen) {
      stopAssistant();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-gray-100">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 pt-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-600/20">
                <Volume2 size={40} />
              </div>
              
              <h3 className="text-2xl font-serif italic text-gray-900 mb-2">Voice Assistant</h3>
              <p className="text-sm text-gray-500 mb-8 uppercase tracking-widest font-bold">Powered by Gemini Live</p>

              <div className="w-full min-h-[120px] bg-gray-50 rounded-3xl p-6 mb-8 relative overflow-hidden">
                {isConnecting ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Connecting...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-red-500">
                    <AlertCircle size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
                  </div>
                ) : isActive ? (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-1 h-8 items-center">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: isModelSpeaking ? [8, 24, 8] : [8, 12, 8],
                            backgroundColor: isModelSpeaking ? '#10B981' : '#D1D5DB'
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 0.5, 
                            delay: i * 0.1 
                          }}
                          className="w-1.5 rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 italic line-clamp-3">
                      {transcript || "Listening for your questions..."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <p className="text-sm text-gray-400 italic">Ready to help with your farm</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 w-full">
                {!isActive ? (
                  <button 
                    onClick={startAssistant}
                    disabled={isConnecting}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    <Mic size={20} />
                    Start Talking
                  </button>
                ) : (
                  <button 
                    onClick={stopAssistant}
                    className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                  >
                    <MicOff size={20} />
                    Stop Assistant
                  </button>
                )}
              </div>
              
              <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Language: {language}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
