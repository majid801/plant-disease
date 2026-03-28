import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Camera, 
  Upload, 
  LayoutDashboard, 
  MessageSquare, 
  User as UserIcon, 
  AlertTriangle, 
  Droplets, 
  Leaf, 
  TrendingDown, 
  Send,
  Loader2,
  ChevronRight,
  Info,
  Share2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { detectDisease, chatWithDoctor } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import imageCompression from 'browser-image-compression';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-serif italic mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6 max-w-sm">We encountered an unexpected error. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-gray-50 rounded-lg text-left text-xs overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types ---
const GUEST_USER = {
  uid: 'guest_user_id',
  email: 'guest@example.com',
  displayName: 'Guest Farmer',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
};

interface Detection {
  id?: string;
  userId: string;
  plantName: string;
  diseaseName: string;
  confidence: number;
  severity: string;
  pesticide: string;
  dosage: string;
  organicAlternative: string;
  yieldLossEstimate: string;
  location?: { latitude: number; longitude: number };
  imageUrl?: string;
  createdAt: any;
}

interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: any;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const appUrl = window.location.origin;
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PlantDoc AI',
          text: 'Check out this AI-powered plant disease detection app!',
          url: appUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(appUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-full md:border-t-0 md:border-r">
      <div className="hidden md:flex flex-col items-center mb-8">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">P</div>
      </div>
      <div className="flex justify-between w-full md:flex-col md:gap-8 md:items-center">
        <button onClick={() => setActiveTab('detect')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'detect' ? "text-emerald-600" : "text-gray-400")}>
          <Camera size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Detect</span>
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-emerald-600" : "text-gray-400")}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Stats</span>
        </button>
        <button onClick={() => setActiveTab('chat')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'chat' ? "text-emerald-600" : "text-gray-400")}>
          <MessageSquare size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Doctor</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-600 transition-colors md:hidden">
          <Share2 size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Share</span>
        </button>
      </div>
      <div className="hidden md:flex flex-col items-center mt-auto gap-4">
        <button onClick={handleShare} className="text-gray-400 hover:text-emerald-600 transition-colors">
          <Share2 size={24} />
        </button>
        <div className="w-8 h-8 rounded-full border border-gray-200 bg-emerald-50 flex items-center justify-center text-emerald-600">
          <UserIcon size={16} />
        </div>
      </div>
    </nav>
  );
};

function PlantApp() {
  const user = GUEST_USER;
  const [activeTab, setActiveTab] = useState('detect');
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Profile ---
  useEffect(() => {
    const path = `users/${user.uid}`;
    getDoc(doc(db, path)).then(snap => {
      if (!snap.exists()) {
        setDoc(doc(db, path), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
      }
    }).catch(err => handleFirestoreError(err, OperationType.GET, path));
  }, []);

  // --- Real-time Data ---
  useEffect(() => {
    const path = 'detections';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Detection));
      setDetections(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const path = 'chats';
    const q = query(collection(db, path), where('userId', '==', user.uid), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return unsubscribe;
  }, []);

  // --- Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDetecting(true);
    setLastResult(null);

    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5, // Reduced size for faster mobile processing
        maxWidthOrHeight: 800, // Reduced resolution for faster mobile processing
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });

      const mimeType = compressedFile.type || "image/jpeg";
      const base64 = fileData.split(',')[1];
      const result = await detectDisease(base64, mimeType);
      
      const detectionData: Detection = {
        userId: user.uid,
        ...result,
        imageUrl: fileData,
        createdAt: new Date().toISOString()
      };

      const path = 'detections';
      await addDoc(collection(db, path), detectionData).catch(err => handleFirestoreError(err, OperationType.CREATE, path));
      setLastResult(detectionData);
    } catch (err) {
      console.error("Detection error:", err);
      alert("Analysis failed. Please ensure you have a stable internet connection and try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isChatting) return;
    
    const msg = newMessage;
    setNewMessage('');
    setIsChatting(true);

    try {
      const userMsg: ChatMessage = {
        userId: user.uid,
        role: 'user',
        content: msg,
        createdAt: new Date().toISOString()
      };
      const path = 'chats';
      await addDoc(collection(db, path), userMsg).catch(err => handleFirestoreError(err, OperationType.CREATE, path));

      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const aiResponse = await chatWithDoctor(msg, history);

      const aiMsg: ChatMessage = {
        userId: user.uid,
        role: 'model',
        content: aiResponse,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, path), aiMsg).catch(err => handleFirestoreError(err, OperationType.CREATE, path));
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24 md:pb-0 md:pl-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'detect' && (
            <motion.div 
              key="detect"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Diagnostic Engine</p>
                  <h2 className="text-4xl font-serif italic text-gray-900">New Diagnosis</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Status</p>
                  <p className="text-sm font-mono text-emerald-600">ONLINE_GPU_V3</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment');
                      fileInputRef.current.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  className="aspect-square md:aspect-video bg-white border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group relative overflow-hidden"
                >
                  {isDetecting ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-emerald-600" size={48} />
                      <p className="text-gray-500 font-medium animate-pulse text-center px-4">Analyzing leaf cellular structure...</p>
                    </div>
                  ) : lastResult ? (
                    <img src={lastResult.imageUrl} className="w-full h-full object-cover" alt="Leaf" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <Camera size={32} />
                      </div>
                      <p className="text-lg font-medium text-gray-900">Take Photo</p>
                      <p className="text-sm text-gray-400">Use your camera</p>
                    </>
                  )}
                </div>

                <div 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture');
                      fileInputRef.current.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  className="aspect-square md:aspect-video bg-white border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group relative overflow-hidden"
                >
                  {isDetecting ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-emerald-600" size={48} />
                      <p className="text-gray-500 font-medium animate-pulse text-center px-4">Processing image...</p>
                    </div>
                  ) : lastResult ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                      <p className="text-xs">New analysis will replace this</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <Upload size={32} />
                      </div>
                      <p className="text-lg font-medium text-gray-900">Upload Image</p>
                      <p className="text-sm text-gray-400">From your gallery</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
              </div>

              {lastResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif italic text-gray-900">{lastResult.diseaseName}</h3>
                      <p className="text-gray-500">Detected in {lastResult.plantName}</p>
                    </div>
                    <div className={cn(
                      "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                      lastResult.severity === 'High' ? "bg-red-50 text-red-600" : 
                      lastResult.severity === 'Medium' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {lastResult.severity} Severity
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <Droplets size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Pesticide</span>
                      </div>
                      <p className="font-medium text-gray-900">{lastResult.pesticide}</p>
                      <p className="text-xs text-gray-500 mt-1">{lastResult.dosage}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <Leaf size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Organic</span>
                      </div>
                      <p className="font-medium text-gray-900">{lastResult.organicAlternative}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <TrendingDown size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Yield Risk</span>
                      </div>
                      <p className="font-medium text-gray-900">{lastResult.yieldLossEstimate} Loss</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Info size={16} />
                      <span className="text-xs">Confidence: {(lastResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <button onClick={() => setActiveTab('chat')} className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                      Consult Plant Doctor <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Analytics Dashboard</p>
                <h2 className="text-4xl font-serif italic text-gray-900">Crop Health Stats</h2>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Recent Detections</h3>
                  <div className="space-y-4">
                    {detections.slice(0, 5).map((d, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Leaf size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{d.diseaseName}</p>
                          <p className="text-xs text-gray-500">{d.plantName} • {new Date(d.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          d.severity === 'High' ? "bg-red-500" : d.severity === 'Medium' ? "bg-orange-500" : "bg-emerald-500"
                        )} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Yield Loss Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="time" hide />
                        <YAxis type="number" dataKey="y" name="loss" hide />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="severity" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Detections" data={detections.map((d, i) => ({
                          x: i,
                          y: parseInt(d.yieldLossEstimate) || 0,
                          z: d.severity === 'High' ? 100 : d.severity === 'Medium' ? 50 : 20,
                          name: d.diseaseName
                        }))}>
                          {detections.map((d, index) => (
                            <Cell key={`cell-${index}`} fill={d.severity === 'High' ? '#EF4444' : d.severity === 'Medium' ? '#F97316' : '#10B981'} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-4 italic">Bubble size indicates severity level</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-[calc(100vh-12rem)] md:h-[calc(100vh-6rem)] flex flex-col"
            >
              <header className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">AI Consultation</p>
                <h2 className="text-4xl font-serif italic text-gray-900">Plant Doctor</h2>
              </header>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-gray-500">Ask me anything about your crops, pesticides, or soil management.</p>
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                      m.role === 'user' ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-900 rounded-tl-none"
                    )}>
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none flex gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask the doctor..."
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatting}
                  className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlantApp />
    </ErrorBoundary>
  );
}
