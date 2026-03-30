import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { VoiceAssistant } from './components/VoiceAssistant';
import { 
  X,
  Camera, 
  Upload, 
  LayoutDashboard, 
  MessageSquare, 
  User as UserIcon, 
  AlertTriangle, 
  Droplets, 
  Leaf, 
  TrendingDown, 
  TrendingUp,
  Send,
  Loader2,
  ChevronRight,
  Info,
  Share2,
  Bot,
  Globe,
  WifiOff,
  Mic,
  Volume2,
  RotateCw,
  Maximize,
  Calendar,
  History,
  Cpu,
  Zap,
  BarChart3,
  Bell,
  Box,
  GitCompare,
  Timer,
  Dna,
  Warehouse,
  Wind,
  Grid,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Bug,
  CloudRain,
  Sun,
  Cloud,
  Thermometer,
  Clock,
  Waves,
  FlaskConical,
  LineChart as LineChartIcon,
  Calculator,
  ShoppingBag,
  ShieldCheck,
  Brain,
  ThumbsUp,
  ThumbsDown,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Eye,
  RefreshCw,
  Workflow,
  Database,
  CalendarCheck,
  Scissors,
  Truck,
  DollarSign,
  PieChart,
  ShieldAlert,
  Scale,
  Layers,
  TreeDeciduous,
  Map,
  Wallet,
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { detectDisease, chatWithDoctor, getAdvancedFarmAdvice, type AdvancedFeature } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScatterChart, 
  Scatter, 
  LineChart,
  Line,
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

// --- Translations ---
const TRANSLATIONS: Record<string, any> = {
  English: {
    detect: "Detect",
    assistant: "Assistant",
    stats: "Stats",
    twin: "Twin",
    doctor: "Doctor",
    welcome: "Welcome to PlantDoc AI",
    tagline: "Your autonomous agricultural intelligence partner. Choose your preferred language to begin.",
    upload: "Upload Leaf Image",
    analyze: "Analyze",
    healthScore: "Farm Health Score",
    soilType: "Soil Type",
    growthStage: "Growth Stage",
    calendar: "Farm Calendar",
    setReminder: "Set Farming Reminder",
    upcoming: "Upcoming Reminders",
    wakeUp: "Wake Up!",
    dismiss: "Dismiss Alarm",
    testSound: "Test Sound",
    setToNow: "Set to Now",
    selectDate: "Select Date",
    wakeUpTime: "Wake Up Time",
    ringtone: "Ringtone",
    advancedLocked: "Advanced Tools Locked",
    advancedLockedDesc: "Upload and analyze your first crop image to unlock advanced simulations and farm twin tools.",
    goToDiagnostic: "Go to Diagnostic Engine",
    noData: "No Data Available",
    noDataDesc: "Upload and analyze your first crop image to see real-time farm statistics and analytics.",
  },
  Hindi: {
    detect: "पहचानें",
    assistant: "सहायक",
    stats: "आंकड़े",
    twin: "ट्विन",
    doctor: "डॉक्टर",
    welcome: "PlantDoc AI में आपका स्वागत है",
    tagline: "आपका स्वायत्त कृषि खुफिया भागीदार। शुरू करने के लिए अपनी पसंदीदा भाषा चुनें।",
    upload: "पत्ती की छवि अपलोड करें",
    analyze: "विश्लेषण करें",
    healthScore: "फार्म स्वास्थ्य स्कोर",
    soilType: "मिट्टी का प्रकार",
    growthStage: "विकास का चरण",
    calendar: "फार्म कैलेंडर",
    setReminder: "खेती अनुस्मारक सेट करें",
    upcoming: "आगामी अनुस्मारक",
    wakeUp: "जाग जाओ!",
    dismiss: "अलार्म बंद करें",
    testSound: "ध्वनि परीक्षण",
    setToNow: "अभी सेट करें",
    selectDate: "तारीख चुनें",
    wakeUpTime: "जागने का समय",
    ringtone: "रिंगटोन",
    advancedLocked: "उन्नत उपकरण लॉक हैं",
    advancedLockedDesc: "उन्नत सिमुलेशन और फार्म ट्विन टूल को अनलॉक करने के लिए अपनी पहली फसल छवि अपलोड और विश्लेषण करें।",
    goToDiagnostic: "डायग्नोस्टिक इंजन पर जाएं",
    noData: "कोई डेटा उपलब्ध नहीं है",
    noDataDesc: "वास्तविक समय के कृषि आंकड़े और विश्लेषण देखने के लिए अपनी पहली फसल छवि अपलोड और विश्लेषण करें।",
  },
  Telugu: {
    detect: "గుర్తించు",
    assistant: "సహాయకుడు",
    stats: "గణాంకాలు",
    twin: "ట్విన్",
    doctor: "డాక్టర్",
    welcome: "PlantDoc AI కి స్వాగతం",
    tagline: "మీ స్వయంప్రతిపత్తి కలిగిన వ్యవసాయ మేధస్సు భాగస్వామి. ప్రారంభించడానికి మీకు ఇష్టమైన భాషను ఎంచుకోండి.",
    upload: "ఆకు చిత్రాన్ని అప్‌లోడ్ చేయండి",
    analyze: "విశ్లేషించండి",
    healthScore: "ఫార్మ్ హెల్త్ స్కోర్",
    soilType: "నేల రకం",
    growthStage: "పెరుగుదల దశ",
    calendar: "ఫార్మ్ క్యాలెண்டర్",
    setReminder: "రిమైండర్ సెట్ చేయండి",
    upcoming: "రాబోయే రిమైండర్లు",
    wakeUp: "మేల్కొనండి!",
    dismiss: "అలారం ఆపివేయి",
    testSound: "ధ్వని పరీక్ష",
    setToNow: "ఇప్పుడే సెట్ చేయండి",
    selectDate: "తేదీని ఎంచుకోండి",
    wakeUpTime: "మేల్కొనే సమయం",
    ringtone: "రింగ్‌టోన్",
    advancedLocked: "అధునాతన సాధనాలు లాక్ చేయబడ్డాయి",
    advancedLockedDesc: "అధునాతన అనుకరణలు మరియు ఫార్మ్ ట్విన్ సాధనాలను అన్‌లాక్ చేయడానికి మీ మొదటి పంట చిత్రాన్ని అప్‌లోడ్ చేయండి మరియు విశ్లేషించండి.",
    goToDiagnostic: "డయాగ్నస్టిక్ ఇంజిన్‌కు వెళ్లండి",
    noData: "డేటా అందుబాటులో లేదు",
    noDataDesc: "నిజ-సమయ ఫార్మ్ గణాంకాలు మరియు విశ్లేషణలను చూడటానికి మీ మొదటి పంట చిత్రాన్ని అప్‌లోడ్ చేయండి మరియు విશ્లేషించండి.",
  },
  Marathi: {
    detect: "ओळखा",
    assistant: "सहाय्यक",
    stats: "आकडेवारी",
    twin: "ट्विन",
    doctor: "डॉक्टर",
    welcome: "PlantDoc AI मध्ये आपले स्वागत आहे",
    tagline: "तुमचा स्वायत्त कृषी बुद्धिमत्ता भागीदार. सुरू करण्यासाठी तुमची आवडती भाषा निवडा.",
    upload: "पानाचे चित्र अपलोड करा",
    analyze: "विश्लेषण करा",
    healthScore: "फार्म हेल्थ स्कोर",
    soilType: "मातीचा प्रकार",
    growthStage: "वाढीचा टप्पा",
    calendar: "फार्म कॅलेंडर",
    setReminder: "रिमाइंडर सेट करा",
    upcoming: "येणारे रिमाइंडर",
    wakeUp: "जागे व्हा!",
    dismiss: "अलार्म बंद करा",
    testSound: "ध्वनी चाचणी",
    setToNow: "आता सेट करा",
    selectDate: "तारीख निवडा",
    wakeUpTime: "जागण्याची वेळ",
    ringtone: "रिंगटोन",
    advancedLocked: "प्रगत साधने लॉक आहेत",
    advancedLockedDesc: "प्रगत सिम्युलेशन आणि फार्म ट्विन टूल्स अनलॉक करण्यासाठी तुमची पहिली पीक प्रतिमा अपलोड आणि विश्लेषण करा.",
    goToDiagnostic: "डायग्नोस्टिक इंजिनवर जा",
    noData: "कोणताही डेटा उपलब्ध नाही",
    noDataDesc: "रिअल-टाइम फार्म आकडेवारी आणि विश्लेषण पाहण्यासाठी तुमची पहिली पीक प्रतिमा अपलोड आणि विश्लेषण करा.",
  },
  Punjabi: {
    detect: "ਪਛਾਣੋ",
    assistant: "ਸਹਾਇਕ",
    stats: "ਅੰਕੜੇ",
    twin: "ਟਵਿਨ",
    doctor: "ਡਾਕਟਰ",
    welcome: "PlantDoc AI ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    tagline: "ਤੁਹਾਡਾ ਖੁਦਮੁਖਤਿਆਰ ਖੇਤੀਬਾੜੀ ਖੁਫੀਆ ਸਾਥੀ। ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ।",
    upload: "ਪੱਤੇ ਦੀ ਤਸਵੀਰ ਅਪਲੋਡ ਕਰੋ",
    analyze: "ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ",
    healthScore: "ਫਾਰਮ ਸਿਹਤ ਸਕੋਰ",
    soilType: "ਮਿੱਟੀ ਦੀ ਕਿਸਮ",
    growthStage: "ਵਿਕਾਸ ਦਾ ਪੜਾਅ",
    calendar: "ਫਾਰਮ ਕੈਲੰਡਰ",
    setReminder: "ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰੋ",
    upcoming: "ਆਉਣ ਵਾਲੇ ਰਿਮਾਈਂਡਰ",
    wakeUp: "ਜਾਗ ਜਾਓ!",
    dismiss: "ਅਲਾਰਮ ਬੰਦ ਕਰੋ",
    testSound: "ਧੁਨੀ ਟੈਸਟ",
    setToNow: "ਹੁਣੇ ਸੈੱਟ ਕਰੋ",
    selectDate: "ਤਾਰੀਖ ਚੁਣੋ",
    wakeUpTime: "ਜਾਗਣ ਦਾ ਸਮਾਂ",
    ringtone: "ਰਿੰਗਟੋਨ",
    advancedLocked: "ਉੱਨਤ ਟੂਲ ਲਾਕ ਹਨ",
    advancedLockedDesc: "ਉੱਨਤ ਸਿਮੂਲੇਸ਼ਨ ਅਤੇ ਫਾਰਮ ਟਵਿਨ ਟੂਲਸ ਨ�
// --- Utils ---
�স্টিক ইঞ্জিনে যান",
    noData: "কোন তথ্য উপলব্ধ নেই",
    noDataDesc: "রিয়েল-টাইম ফার্ম পরিসংখ্যান এবং বিশ্লেষণ দেখতে আপনার প্রথম ফসলের ছবি আপলোড এবং বিশ্লেষণ করুন।",
  },
  Tamil: {
    detect: "கண்டறியவும்",
    assistant: "உதவியாளர்",
    stats: "புள்ளிவிவரங்கள்",
    twin: "ட்வின்",
    doctor: "டாக்டர்",
    welcome: "PlantDoc AI-க்கு உங்களை வரவேற்கிறோம்",
    tagline: "உங்கள் தன்னாட்சி விவசாய நுண்ணறிவு கூட்டாளர். தொடங்க உங்களுக்கு விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.",
    upload: "இலை படத்தை பதிவேற்றவும்",
    analyze: "பகுப்பாய்வு செய்",
    healthScore: "பண்ணை சுகாதார மதிப்பெண்",
    soilType: "மண் வகை",
    growthStage: "வளர்ச்சி நிலை",
    calendar: "பண்ணை காலண்டர்",
    setReminder: "நினைவூட்டலை அமைக்கவும்",
    upcoming: "வரவிருக்கும் நினைவூட்டல்கள்",
    wakeUp: "எழுந்திரு!",
    dismiss: "அலாரத்தை நிறுத்து",
    testSound: "ஒலி சோதனை",
    setToNow: "இப்போது அமைக்கவும்",
    selectDate: "தேதியைத் தேர்ந்தெடுக்கவும்",
    wakeUpTime: "எழுந்திருக்கும் நேரம்",
    ringtone: "ரிங்டோன்",
    advancedLocked: "மேம்பட்ட கருவிகள் பூட்டப்பட்டுள்ளன",
    advancedLockedDesc: "மேம்பட்ட உருவகப்படுத்துதல்கள் மற்றும் பண்ணை இரட்டை கருவிகளைத் திறக்க உங்கள் முதல் பயிர் படத்தைப் பதிவேற்றி பகுப்பாய்வு செய்யுங்கள்.",
    goToDiagnostic: "கண்டறியும் இயந்திரத்திற்குச் செல்லவும்",
    noData: "தரவு எதுவும் இல்லை",
    noDataDesc: "நிகழ்நேர பண்ணை புள்ளிவிவரங்கள் மற்றும் பகுப்பாய்வுகளைப் பார்க்க உங்கள் முதல் பயிர் படத்தைப் பதிவேற்றி பகுப்பாய்வு செய்யுங்கள்.",
  },
  Kannada: {
    detect: "ಗುರುತಿಸಿ",
    assistant: "ಸಹಾಯಕ",
    stats: "ಅಂಕಿಅಂಶಗಳು",
    twin: "ಟ್ವಿನ್",
    doctor: "ಡಾಕ್ಟರ್",
    welcome: "PlantDoc AI ಗೆ ಸುಸ್ವಾಗತ",
    tagline: "ನಿಮ್ಮ ಸ್ವಾಯತ್ತ ಕೃಷಿ ಬುದ್ಧಿಮತ್ತೆ ಪಾಲುದಾರ. ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ.",
    upload: "ಎಲೆ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    analyze: "ವಿಶ್ಲೇಷಿಸಿ",
    healthScore: "ಫಾರ್ಮ್ ಹೆಲ್ತ್ ಸ್ಕೋರ್",
    soilType: "ಮಣ್ಣಿನ ವಿಧ",
    growthStage: "ಬೆಳವಣಿಗೆಯ ಹಂತ",
    calendar: "ಫಾರ್ಮ್ ಕ್ಯಾಲೆಂಡರ್",
    setReminder: "ಜ್ಞಾಪನೆಯನ್ನು ಹೊಂದಿಸಿ",
    upcoming: "ಮುಂಬರುವ ಜ್ಾಪನೆಗಳು",
    wakeUp: "ಎಚ್ಚರಗೊಳ್ಳಿ!",
    dismiss: "ಅಲಾರಂ ನಿಲ್ಲಿಸಿ",
    testSound: "ಧ್ವನಿ ಪರೀಕ್ಷೆ",
    setToNow: "ಈಗ ಹೊಂದಿಸಿ",
    selectDate: "ದಿನಾಂಕವನ್ನು ಆರಿಸಿ",
    wakeUpTime: "ಎಚ್ಚರಗೊಳ್ಳುವ ಸಮಯ",
    ringtone: "ರಿಂಗ್‌ಟೋನ್",
    advancedLocked: "ಸುಧಾರಿತ ಪರಿಕರಗಳನ್ನು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ",
    advancedLockedDesc: "ಸುಧಾರಿತ ಸಿಮ್ಯುಲೇಶನ್‌ಗಳು ಮತ್ತು ಫಾರ್ಮ್ ಟ್ವಿನ್ ಪರಿಕರಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಲು ನಿಮ್ಮ ಮೊದಲ ಬೆಳೆ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ವಿಶ್ಲೇಷಿಸಿ.",
    goToDiagnostic: "ಡಯಾಗ್ನೋಸ್ಟಿಕ್ ಎಂಜಿನ್‌ಗೆ ಹೋಗಿ",
    noData: "ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ",
    noDataDesc: "ನೈಜ-ಸಮಯದ ಫಾರ್ಮ್ ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ವಿಶ್ಲೇಷಣೆಯನ್ನು ನೋಡಲು ನಿಮ್ಮ ಮೊದಲ ಬೆಳೆ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ವಿಶ್ಲೇಷಿಸಿ.",
  }
};

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
      let isQuotaError = false;
      let errorMessage = this.state.error?.message || "";
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.includes("Quota limit exceeded")) {
          isQuotaError = true;
        }
      } catch (e) {
        // Not a JSON error
      }

      if (isQuotaError) {
        return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <History size={40} />
            </div>
            <h2 className="text-3xl font-serif italic mb-4 text-gray-900">Daily Limit Reached</h2>
            <p className="text-gray-600 mb-2 max-w-md">
              Our free diagnostic engine has reached its daily limit for today.
            </p>
            <p className="text-gray-500 mb-8 max-w-sm text-sm italic">
              Don't worry! Your data is safe. The system will automatically reset at midnight (Pacific Time).
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button 
                onClick={() => window.location.reload()}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                Try Again Later
              </button>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Quota Resets Daily
              </p>
            </div>
          </div>
        );
      }

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
          <pre className="mt-8 p-4 bg-gray-50 rounded-lg text-left text-[10px] overflow-auto max-w-full text-gray-400 font-mono">
            {errorMessage}
          </pre>
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

interface DetectionAnalysis {
  crop: string;
  issue: string;
  severity: number;
  confidence: number;
  chemicalPath: string;
  organicPath: string;
}

interface Detection {
  id?: string;
  userId: string;
  analyses: DetectionAnalysis[];
  fieldSummary: string;
  imageUrls: string[];
  soilType?: string;
  growthStage?: string;
  createdAt: any;
}

interface Reminder {
  id: string;
  date: string;
  time: string;
  ringtone: string;
  label: string;
  active: boolean;
}

interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: any;
}

// --- Components ---

const Navbar = ({ activeTab, setActiveTab, hasDetections, language }: { activeTab: string, setActiveTab: (t: string) => void, hasDetections: boolean, language: string }) => {
  const appUrl = window.location.origin;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
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
          <span className="text-[10px] font-medium uppercase tracking-wider">{t.detect}</span>
        </button>
        <button onClick={() => setActiveTab('voice')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'voice' ? "text-emerald-600" : "text-gray-400")}>
          <Volume2 size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{t.assistant}</span>
        </button>
        {hasDetections && (
          <>
            <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-emerald-600" : "text-gray-400")}>
              <LayoutDashboard size={24} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t.stats}</span>
            </button>
            <button onClick={() => setActiveTab('advanced')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'advanced' ? "text-emerald-600" : "text-gray-400")}>
              <Cpu size={24} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{t.twin}</span>
            </button>
          </>
        )}
        <button onClick={() => setActiveTab('chat')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'chat' ? "text-emerald-600" : "text-gray-400")}>
          <MessageSquare size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{t.doctor}</span>
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
  const [activeTab, setActiveTab] = useState('onboarding');
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedTime, setSelectedTime] = useState('06:00');
  const [selectedRingtone, setSelectedRingtone] = useState('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [soilType, setSoilType] = useState('Not specified');
  const [growthStage, setGrowthStage] = useState('Not specified');
  const [language, setLanguage] = useState('English');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<string | null>(null);
  const [isProcessingAdvanced, setIsProcessingAdvanced] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<AdvancedFeature | null>(null);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string>(new Date().toISOString());
  const [chatImage, setChatImage] = useState<{ data: string, type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  // --- Audio Unlocker ---
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-notification-ding-1589.mp3');
      audio.volume = 0;
      audio.play().catch(() => {});
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // --- Offline Detection ---
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        }).catch(err => {
          if (err.message.includes('Quota exceeded')) setIsQuotaExceeded(true);
          else handleFirestoreError(err, OperationType.WRITE, path);
        });
      }
    }).catch(err => {
      if (err.message.includes('Quota exceeded')) setIsQuotaExceeded(true);
      else handleFirestoreError(err, OperationType.GET, path);
    });
  }, []);

  // --- Real-time Data ---
  useEffect(() => {
    const path = 'detections';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Detection));
      setDetections(data);
    }, (err) => {
      if (err.message.includes('Quota exceeded')) {
        setIsQuotaExceeded(true);
      } else {
        console.error("Detections snapshot error:", err);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const path = 'chats';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid), 
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(data);
    }, (err) => {
      if (err.message.includes('Quota exceeded')) {
        setIsQuotaExceeded(true);
      } else {
        console.error("Chats snapshot error:", err);
      }
    });
    return unsubscribe;
  }, []);

  // --- Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsDetecting(true);
    setLastResult(null);

    try {
      const base64Images: string[] = [];
      const mimeTypes: string[] = [];
      const imageUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Compress image
        const options = {
          maxSizeMB: 0.2, // Reduced from 0.5
          maxWidthOrHeight: 600, // Reduced from 800
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        base64Images.push(fileData.split(',')[1]);
        mimeTypes.push(compressedFile.type || "image/jpeg");
        imageUrls.push(fileData);
      }

      if (isOffline) {
        // Offline-first reasoning fallback
        const offlineResult = {
          analyses: base64Images.map(() => ({
            crop: "Unknown (Offline)",
            issue: "Diagnosis unavailable offline",
            severity: 3,
            confidence: 50,
            chemicalPath: "Connect to internet for specific chemical advice. Generally, ensure proper drainage and remove infected parts.",
            organicPath: "Use neem oil spray or wood ash if symptoms persist. Ensure crop is not water-stressed."
          })),
          fieldSummary: "You are currently offline. Based on your inputs (Soil: " + soilType + ", Stage: " + growthStage + "), maintain general hygiene and check for common pests in your region."
        };
        
        const detectionData: Detection = {
          userId: user.uid,
          analyses: offlineResult.analyses,
          fieldSummary: offlineResult.fieldSummary,
          imageUrls: imageUrls,
          soilType,
          growthStage,
          createdAt: new Date().toISOString()
        };
        setLastResult(detectionData);
        return;
      }

      const result = await detectDisease(base64Images, mimeTypes, soilType, growthStage);
      
      const detectionData: Detection = {
        userId: user.uid,
        analyses: result.analyses,
        fieldSummary: result.fieldSummary,
        imageUrls: imageUrls,
        soilType,
        growthStage,
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
    if ((!newMessage.trim() && !chatImage) || isChatting) return;
    
    const msg = newMessage;
    const currentImage = chatImage;
    setNewMessage('');
    setChatImage(null);
    setIsChatting(true);

    try {
      const userMsg: ChatMessage = {
        userId: user.uid,
        role: 'user',
        content: msg + (currentImage ? "\n\n[Image Uploaded]" : ""),
        createdAt: new Date().toISOString()
      };
      const path = 'chats';
      await addDoc(collection(db, path), userMsg).catch(err => handleFirestoreError(err, OperationType.CREATE, path));

      let aiResponse = "";
      if (isOffline) {
        aiResponse = "I'm currently offline. I can't analyze images or provide detailed answers right now. Please check your connection.";
      } else {
        const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
        aiResponse = await chatWithDoctor(msg, history, language, currentImage || undefined);
      }

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

  const clearChat = async () => {
    setShowHistory(false);
    setSessionStartTime(new Date().toISOString());
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });

      setChatImage({
        data: fileData.split(',')[1],
        type: compressedFile.type || "image/jpeg"
      });
    } catch (err) {
      console.error("Chat image upload error:", err);
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    if (isVoiceActive) {
      setIsVoiceActive(false);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = language === 'Hindi' ? 'hi-IN' : 'en-US';
    recognition.onstart = () => setIsVoiceActive(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewMessage(transcript);
      setIsVoiceActive(false);
    };
    recognition.onerror = () => setIsVoiceActive(false);
    recognition.start();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      'Hindi': 'hi-IN',
      'Telugu': 'te-IN',
      'Marathi': 'mr-IN',
      'Punjabi': 'pa-IN',
      'Bengali': 'bn-IN',
      'Tamil': 'ta-IN',
      'Kannada': 'kn-IN'
    };
    utterance.lang = langMap[language] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const formatTimeAMPM = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const RINGTONES = [
    { name: 'Classic Alarm', url: 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3' },
    { name: 'Nature Birds', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3' },
    { name: 'Soft Chime', url: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-notification-ding-1589.mp3' },
    { name: 'Morning Sun', url: 'https://assets.mixkit.co/sfx/preview/mixkit-morning-sunrise-alarm-968.mp3' },
  ];

  // --- Alarm System ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      reminders.forEach(reminder => {
        if (reminder.active && reminder.date === currentDate && reminder.time === currentTime) {
          setActiveAlarm(reminder);
          const audio = new Audio(reminder.ringtone);
          audio.play().catch(err => console.error("Audio playback failed:", err));
          setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, active: false } : r));
        }
      });
    }, 1000); // Check every second for precision
    return () => clearInterval(interval);
  }, [reminders]);

  const calculateHealthScore = () => {
    if (detections.length === 0) return 100;
    const recentDetections = detections.slice(0, 5);
    const avgSeverity = recentDetections.reduce((acc, d) => acc + (d.analyses?.[0]?.severity || 0), 0) / recentDetections.length;
    return Math.max(0, Math.min(100, Math.round(100 - (avgSeverity * 15))));
  };

  const healthScore = calculateHealthScore();

  const handleAdvancedAction = async (feature: AdvancedFeature, data: any) => {
    setIsProcessingAdvanced(true);
    setAdvancedResult(null);
    setSelectedFeature(feature);
    try {
      const result = await getAdvancedFarmAdvice(feature, data, language);
      setAdvancedResult(result);
    } catch (err) {
      console.error("Advanced feature error:", err);
      alert("Failed to process request. Please try again.");
    } finally {
      setIsProcessingAdvanced(false);
    }
  };

  const renderAdvancedTool = () => {
    const tools = [
      { id: 'digital_twin', name: 'Farm Digital Twin', icon: Cpu, desc: 'Simulate land future & risks' },
      { id: 'nutrient_deficiency', name: 'Nutrient Detector', icon: Zap, desc: 'Identify & fix leaf symptoms' },
      { id: 'resource_optimization', name: 'Resource Optimizer', icon: BarChart3, desc: 'Maximize yield, minimize cost' },
      { id: 'early_warning', name: 'Early Warning', icon: Bell, desc: 'Predict issues 10-20 days ahead' },
      { id: 'cross_crop', name: 'Crop Impact Check', icon: GitCompare, desc: 'Analyze intercropping effects' },
      { id: 'harvest_timing', name: 'Harvest Timing', icon: Timer, desc: 'Optimize quality & drying' },
      { id: 'seed_quality', name: 'Seed Evaluator', icon: Dna, desc: 'Check seed health & storage' },
      { id: 'post_harvest', name: 'Post-Harvest Advisor', icon: Warehouse, desc: 'Safe storage & protection' },
      { id: 'spray_planner', name: 'Smart Spray Planner', icon: Wind, desc: 'Safe routines & mix checks' },
      { id: 'layout_optimizer', name: 'Field Layout Optimizer', icon: Grid, desc: 'Spacing & drip-line design' },
      { id: 'sensor_integration', name: 'Sensor Integration', icon: Activity, desc: 'Real-time moisture, pH & drone data' },
      { id: 'pest_migration', name: 'Pest Tracker', icon: Bug, desc: 'Predict outbreaks before they start' },
      { id: 'climate_adaptive', name: 'Climate Adaptive', icon: CloudRain, desc: 'Resilient sowing & rotation plans' },
      { id: 'auto_irrigation', name: 'Auto Irrigation', icon: Waves, desc: 'Precise water usage scheduling' },
      { id: 'disease_lab', name: 'Disease Lab', icon: FlaskConical, desc: 'Simulate pathogen spread scenarios' },
      { id: 'yield_forecast', name: 'Yield Forecast', icon: LineChartIcon, desc: 'Realistic harvest expectations' },
      { id: 'cost_benefit', name: 'Profit Optimizer', icon: Calculator, desc: 'Cost-benefit analysis per plot' },
      { id: 'market_advisor', name: 'Market Advisor', icon: ShoppingBag, desc: 'Harvest timing & selling strategy' },
      { id: 'insurance_assessment', name: 'Insurance Assessor', icon: ShieldCheck, desc: 'Risk & loss estimation' },
      { id: 'continuous_learning', name: 'Continuous Learning', icon: Brain, desc: 'AI adapts to your farm results' },
      { id: 'autonomous_monitoring', name: 'Autonomous Monitoring', icon: Eye, desc: 'Live IoT & satellite status' },
      { id: 'predictive_loops', name: 'Predictive AI Loops', icon: RefreshCw, desc: 'Continuous proactive adjustments' },
      { id: 'autonomous_allocation', name: 'Autonomous Allocation', icon: Workflow, desc: 'Dynamic resource assignment' },
      { id: 'self_updating_models', name: 'Self-Updating Models', icon: Database, desc: 'Learn from local outbreaks' },
      { id: 'automated_schedules', name: 'Automated Schedules', icon: CalendarCheck, desc: 'Safe spray & fertilization' },
      { id: 'dynamic_rotation', name: 'Dynamic Rotation', icon: RotateCw, desc: 'Soil-based succession planning' },
      { id: 'harvest_automation', name: 'Harvest Automation', icon: Scissors, desc: 'Optimal harvest sequence' },
      { id: 'post_harvest_logistics', name: 'Post-Harvest Logistics', icon: Truck, desc: 'Storage & transport planning' },
      { id: 'financial_dashboard', name: 'Financial Dashboard', icon: PieChart, desc: 'Real-time ROI & alerts' },
      { id: 'autonomous_learning_v2', name: 'Autonomous Learning v2', icon: Brain, desc: 'Self-improving AI models' },
      { id: 'predictive_control', name: 'Predictive Control', icon: Cpu, desc: 'Full-farm live adaptive control' },
      { id: 'predictive_trading', name: 'Predictive Trading', icon: DollarSign, desc: 'Optimal selling & market timing' },
      { id: 'regulatory_compliance', name: 'Compliance Monitor', icon: Scale, desc: 'Pesticide & safety standards' },
      { id: 'multi_plot_management', name: 'Multi-Plot Manager', icon: Layers, desc: 'Autonomous multi-plot scheduling' },
      { id: 'sustainability_scoring', name: 'Sustainability Score', icon: TreeDeciduous, desc: 'Carbon & biodiversity impact' },
      { id: 'risk_mitigation', name: 'Risk Mitigation', icon: ShieldAlert, desc: 'Contingency plans for volatility' },
      { id: 'precision_logistics', name: 'Precision Logistics', icon: Map, desc: 'Autonomous labor & crop routing' },
      { id: 'financial_forecasting', name: 'Financial Forecast', icon: Wallet, desc: 'Cash flow & investment suggestions' },
      { id: 'self_evolution', name: 'Self-Evolution AI', icon: RefreshCw, desc: 'Autonomously improving models' },
    ];

    if (selectedFeature && (isProcessingAdvanced || advancedResult)) {
      return (
        <div className="space-y-6">
          <button 
            onClick={() => { setSelectedFeature(null); setAdvancedResult(null); }}
            className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <ChevronRight className="rotate-180" size={16} />
            Back to Tools
          </button>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                {React.createElement(tools.find(t => t.id === selectedFeature)?.icon || Cpu, { size: 24 })}
              </div>
              <div>
                <h3 className="text-2xl font-serif italic text-gray-900">{tools.find(t => t.id === selectedFeature)?.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Analysis Result</p>
              </div>
            </div>

            {isProcessingAdvanced ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="text-sm text-gray-500 font-medium animate-pulse">AI is simulating your farm patterns...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedFeature === 'disease_lab' && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-2 text-red-600 mb-4">
                      <AlertTriangle size={20} />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Simulation: Pathogen Spread</h4>
                    </div>
                    <div className="grid grid-cols-5 gap-2 h-24">
                      {[...Array(15)].map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "rounded-lg transition-all duration-1000",
                            i < 3 ? "bg-red-500 animate-pulse" : i < 8 ? "bg-red-200" : "bg-emerald-100"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-red-600 mt-4 font-medium italic">Red indicates high infection risk areas based on current humidity and wind direction.</p>
                  </div>
                )}
                
                {selectedFeature === 'yield_forecast' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-2 text-emerald-600 mb-4">
                      <TrendingUp size={20} />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Yield Confidence Range</h4>
                    </div>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'W1', yield: 80 },
                          { name: 'W2', yield: 85 },
                          { name: 'W3', yield: 82 },
                          { name: 'W4', yield: 90 },
                        ]}>
                          <Line type="monotone" dataKey="yield" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                          <Tooltip />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-4 font-medium italic">Predicted yield: 85-92% of maximum potential.</p>
                  </div>
                )}

                <div className="prose prose-emerald max-w-none">
                  <ReactMarkdown>{advancedResult || ''}</ReactMarkdown>
                </div>
              </div>
            )}

            {!isProcessingAdvanced && advancedResult && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 text-center">Continuous Learning: Did this help?</p>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => {
                      alert("Thank you! AI is learning from your success.");
                      setSelectedFeature(null);
                      setAdvancedResult(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    <ThumbsUp size={18} />
                    Yes, it worked
                  </button>
                  <button 
                    onClick={() => {
                      alert("Feedback recorded. AI will adjust its logic for your farm.");
                      setSelectedFeature(null);
                      setAdvancedResult(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all"
                  >
                    <ThumbsDown size={18} />
                    No, not helpful
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Advanced Intelligence</p>
          <h2 className="text-4xl font-serif italic text-gray-900">Farm Twin & Tools</h2>
          <p className="text-gray-500 mt-2">Ultra-advanced simulations and optimizations for your land.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                // For demo, we'll use current app state as data
                const data = {
                  soil: soilType,
                  crop: detections[0]?.analyses[0]?.crop || 'General',
                  stage: growthStage,
                  weather: 'Hot and humid with occasional rain',
                  history: 'Previous fungal issues in rainy season',
                  irrigation: 'Drip irrigation, 2 hours daily',
                  symptoms: 'Yellowing edges on older leaves',
                  leafColor: 'Pale green with brown spots',
                  water: 'Limited, from local well',
                  fertilizer: 'Urea and Potash available',
                  manpower: '2 workers',
                  landSize: '2 acres',
                  crops: 'Tomato, Chili',
                  season: 'Monsoon',
                  humidity: 'High (80%)',
                  mainCrop: 'Tomato',
                  nearbyCrop: 'Marigold',
                  climate: 'Tropical',
                  diseaseRisk: 'High fungal risk',
                  color: 'Bright brown',
                  size: 'Uniform',
                  moisture: 'Low',
                  firmness: 'Hard',
                  seedType: 'Local variety',
                  volume: '500kg',
                  storage: 'Cool dry room',
                  issue: 'Leaf spot',
                  landShape: 'Rectangular',
                  ph: '6.5',
                  temp: '28°C',
                  drone: 'NDVI scan shows low vigor in North-East corner',
                  nearby: 'Aphid outbreak reported 2km South',
                  region: 'Central Plains',
                  trend: 'Increasingly erratic rainfall',
                  et: '5.2mm/day',
                  pathogens: 'Early Blight spores detected',
                  scenarios: 'Heavy rain predicted for 3 days',
                  resources: 'Water, Fertilizer, Labor',
                  labor: 'Family labor + 2 seasonal workers',
                  inputs: 'Seeds, NPK, Organic Compost',
                  revenue: 'Projected $2000/acre',
                  harvest: 'Late October',
                  markets: 'Local mandi, Cooperative society',
                  value: '$5000 total crop value',
                  actions: 'Applied neem oil, increased irrigation',
                  feedback: 'Good results with neem oil',
                  results: 'Pest count reduced by 60%',
                  sensors: 'Soil moisture 42%, pH 6.5, Temp 28°C',
                  satellite: 'High vegetation index in North sector',
                  pest: 'Aphids, Whiteflies',
                  machinery: '1 Tractor, 2 Sprayers',
                  plots: 'Plot A (Tomato), Plot B (Chili)',
                  outbreaks: 'Early blight reported in neighboring village',
                  lab: 'Soil sample analysis #452',
                  trends: 'Increasing humidity in the region',
                  mix: 'Imidacloprid + Organic surfactant',
                  phi: '7 days',
                  env: 'Safe for pollinators',
                  demand: 'High for organic tomatoes',
                  prevCrop: 'Wheat',
                  maturity: '85% ripe',
                  drying: 'Solar dryer available',
                  transport: 'Refrigerated truck needed',
                  dispatch: 'Direct to retail chain',
                  roi: '15% projected',
                  field: 'Field 1 (North)',
                  global: 'El Niño pattern affecting rainfall',
                  market: 'Export quality required, prices trending up',
                  quality: 'Grade A',
                  pesticides: 'Organic neem based, within limits',
                  safety: 'ISO 22000 compliant',
                  needs: 'High nitrogen demand in vegetative stage',
                  carbon: 'Low footprint (0.2 tCO2e/acre)',
                  biodiversity: 'High (native pollinator presence)',
                  pests: 'Minimal, monitoring for whiteflies',
                  disease: 'No active pathogens',
                  volatility: 'Low market fluctuation',
                  cashflow: 'Positive, $1200 surplus',
                };
                handleAdvancedAction(tool.id as AdvancedFeature, data);
              }}
              className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:border-emerald-600 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-2xl flex items-center justify-center transition-colors">
                  <tool.icon size={24} />
                </div>
                <div>
                  <h4 className="font-serif italic text-xl text-gray-900 mb-1">{tool.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{tool.desc}</p>
                </div>
                <ChevronRight className="ml-auto text-gray-300 group-hover:text-emerald-600 transition-colors" size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24 md:pb-0 md:pl-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} hasDetections={detections.length > 0} language={language} />

      <VoiceAssistant 
        isOpen={isVoiceAssistantOpen} 
        onClose={() => setIsVoiceAssistantOpen(false)} 
        language={language} 
      />

      <main className="max-w-4xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20 mb-4">
                <Leaf size={48} />
              </div>
              <div>
                <h1 className="text-5xl font-serif italic text-gray-900 mb-4">{t.welcome}</h1>
                <p className="text-gray-500 max-w-md mx-auto">{t.tagline}</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
                {['English', 'Hindi', 'Telugu', 'Marathi', 'Punjabi', 'Bengali', 'Tamil', 'Kannada'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setActiveTab('detect'); }}
                    className="p-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {isQuotaExceeded && activeTab !== 'onboarding' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-6 text-amber-800 shadow-sm"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <History size={28} />
              </div>
              <div className="flex-1">
                <p className="text-lg font-serif italic text-gray-900">Daily Diagnostic Limit Reached</p>
                <p className="text-sm text-gray-600">The system is currently in offline mode. You can still use the app with your cached farm data.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

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
                  <h2 className="text-4xl font-serif italic text-gray-900">Farm Intelligence</h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                    <Globe size={14} className="text-emerald-600" />
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  </div>
                  {isOffline && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <WifiOff size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Offline Mode</span>
                    </div>
                  )}
                </div>
              </header>

              {/* Calendar & Weather Dashboard - Always Visible */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Calendar & Today */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-emerald-600" size={20} />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Farm Calendar</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                      >
                        <ChevronRight className="rotate-180" size={16} />
                      </button>
                      <span className="text-xs font-bold text-gray-700 min-w-[80px] text-center">
                        {viewDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </span>
                      <button 
                        onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Year Selector */}
                  <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-50">
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <button
                        key={y}
                        onClick={() => setViewDate(new Date(y, viewDate.getMonth()))}
                        className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                          viewDate.getFullYear() === y ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={`${d}-${i}`} className="text-[8px] font-bold text-gray-400 text-center py-1">{d}</div>
                    ))}
                    {(() => {
                      const year = viewDate.getFullYear();
                      const month = viewDate.getMonth();
                      const days = new Date(year, month + 1, 0).getDate();
                      const firstDay = new Date(year, month, 1).getDay();
                      const prevMonthDays = new Date(year, month, 0).getDate();
                      const calendarDays = [];
                      for (let i = firstDay - 1; i >= 0; i--) calendarDays.push({ day: prevMonthDays - i, current: false });
                      for (let i = 1; i <= days; i++) calendarDays.push({ day: i, current: true });
                      const remaining = 42 - calendarDays.length;
                      for (let i = 1; i <= remaining; i++) calendarDays.push({ day: i, current: false });

                      return calendarDays.map((d, i) => {
                        const dateObj = new Date(year, month, d.day);
                        const dateStr = dateObj.toISOString().split('T')[0];
                        const isSelected = d.current && selectedDate.toDateString() === dateObj.toDateString();
                        const isToday = d.current && new Date().toDateString() === dateObj.toDateString();
                        const hasReminder = d.current && reminders.some(r => r.date === dateStr);

                        return (
                          <button
                            key={i}
                            onClick={() => d.current && setSelectedDate(dateObj)}
                            className={cn(
                              "h-8 w-8 rounded-lg text-[10px] flex items-center justify-center transition-all relative",
                              !d.current ? "text-gray-200" : "text-gray-700 hover:bg-emerald-50",
                              isSelected ? "bg-emerald-600 text-white hover:bg-emerald-700" : "",
                              isToday && !isSelected ? "border border-emerald-600 text-emerald-600" : ""
                            )}
                          >
                            {d.day}
                            {hasReminder && <div className="absolute bottom-1 w-1 h-1 bg-amber-500 rounded-full" />}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-[10px] font-medium">Best time: 6:00 AM - 10:00 AM</span>
                      </div>
                      {reminders.some(r => r.date === selectedDate.toISOString().split('T')[0]) && (
                        <div className="flex items-center gap-1 text-amber-600 animate-pulse">
                          <Bell size={12} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Alarm Set</span>
                        </div>
                      )}
                    </div>

                    {/* Date, Time & Ringtone Selection */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{t.selectDate}</label>
                          <input 
                            type="date" 
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{t.wakeUpTime}</label>
                            <button 
                              onClick={() => {
                                const now = new Date();
                                setSelectedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                                setSelectedDate(now);
                              }}
                              className="text-[8px] font-bold text-emerald-600 uppercase hover:underline"
                            >
                              {t.setToNow}
                            </button>
                          </div>
                          <input 
                            type="time" 
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{t.ringtone}</label>
                        <div className="flex gap-2">
                          <select 
                            value={selectedRingtone}
                            onChange={(e) => {
                              setSelectedRingtone(e.target.value);
                              const audio = new Audio(e.target.value);
                              audio.play().catch(err => console.error("Audio playback failed:", err));
                            }}
                            className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-700 focus:outline-none focus:border-emerald-500"
                          >
                            {RINGTONES.map(r => (
                              <option key={r.url} value={r.url}>{r.name}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const audio = new Audio(selectedRingtone);
                              audio.play().catch(err => console.error("Audio playback failed:", err));
                            }}
                            className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all"
                          >
                            {t.testSound}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Selected Alarm</p>
                      <p className="text-xs font-bold text-gray-900">
                        {selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} at {formatTimeAMPM(selectedTime)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const dateStr = selectedDate.toISOString().split('T')[0];
                        const newReminder: Reminder = {
                          id: Math.random().toString(36).substr(2, 9),
                          date: dateStr,
                          time: selectedTime,
                          ringtone: selectedRingtone,
                          label: 'Farming Task',
                          active: true
                        };
                        setReminders([...reminders, newReminder]);
                        // Simple AI feedback
                        const msg = `Reminder set for ${selectedDate.toLocaleDateString()} at ${formatTimeAMPM(selectedTime)}. I'll play your selected ringtone to wake you up!`;
                        setChatMessages(prev => [...prev, {
                          userId: user.uid,
                          role: 'model',
                          content: msg,
                          createdAt: new Date()
                        }]);
                      }}
                      className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10"
                    >
                      <Bell size={14} />
                      {t.setReminder}
                    </button>

                    {reminders.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{t.upcoming}</p>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                          {reminders.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-amber-700">{new Date(r.date).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-amber-900">{formatTimeAMPM(r.time)}</span>
                                  <span className="text-[8px] font-bold text-amber-600 uppercase">{RINGTONES.find(rt => rt.url === r.ringtone)?.name}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  r.active ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                                )} />
                                <button onClick={() => setReminders(reminders.filter(rem => rem.id !== r.id))} className="text-amber-600 hover:text-amber-800 p-1">
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tomorrow & Week Forecast */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Weather Forecast</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Sun size={14} />
                        <span className="text-xs font-bold">Tomorrow: 28°C Sunny</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <CloudRain size={14} />
                        <span className="text-xs font-bold">Month: Normal Rainfall</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Weekly View */}
                    <div className="grid grid-cols-7 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={day} className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-[8px] font-bold uppercase text-gray-400">{day}</span>
                          {i % 3 === 0 ? <Sun size={14} className="text-amber-500 my-1" /> : <Cloud size={14} className="text-gray-400 my-1" />}
                          <span className="text-[10px] font-bold text-gray-700">{24 + i}°</span>
                        </div>
                      ))}
                    </div>

                    {/* Hourly Prediction - "Exact Timing" */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Next 24 Hours Prediction</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                          { time: '06:00', temp: '22°', icon: Sun, label: 'Cool' },
                          { time: '09:00', temp: '25°', icon: Sun, label: 'Clear' },
                          { time: '12:00', temp: '29°', icon: Sun, label: 'Hot' },
                          { time: '15:00', temp: '31°', icon: Cloud, label: 'Humid' },
                          { time: '18:00', temp: '27°', icon: Cloud, label: 'Breezy' },
                          { time: '21:00', temp: '24°', icon: Cloud, label: 'Calm' },
                        ].map((h, i) => (
                          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[60px]">
                            <span className="text-[10px] font-medium text-gray-500">{h.time}</span>
                            <h.icon size={16} className="text-emerald-600" />
                            <span className="text-xs font-bold text-gray-900">{h.temp}</span>
                            <span className="text-[8px] text-gray-400 uppercase font-bold">{h.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats - Only Visible after Analysis */}
              {lastResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-2",
                      healthScore > 70 ? "bg-emerald-50 text-emerald-600" : healthScore > 40 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                    )}>
                      <span className="text-2xl font-bold">{healthScore}</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Farm Health Score</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Soil Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Black', 'Red', 'Sandy', 'Loamy', 'Clay', 'Not specified'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSoilType(t)}
                          className={cn(
                            "px-2 py-2 rounded-xl text-[10px] font-medium border transition-all",
                            soilType === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Growth Stage</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvesting', 'Not specified'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setGrowthStage(s)}
                          className={cn(
                            "px-2 py-2 rounded-xl text-[10px] font-medium border transition-all",
                            growthStage === s ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Schedule - Only Visible after Analysis */}
                {lastResult && (
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar size={18} className="text-emerald-600" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Daily Farm Schedule</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <Droplets size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Irrigation</p>
                          <p className="text-[10px] text-gray-500">Check moisture at 8:00 AM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <Leaf size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Fertilizer</p>
                          <p className="text-[10px] text-gray-500">Apply NPK (if in Vegetative stage)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <RotateCw size={10} />
                      <span>Rotate Leaf</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50/80 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Maximize size={10} />
                      <span>Show Underside</span>
                    </div>
                  </div>
                  {isDetecting ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-emerald-600" size={48} />
                      <p className="text-gray-500 font-medium animate-pulse text-center px-4">Analyzing leaf cellular structure...</p>
                    </div>
                  ) : lastResult ? (
                    <img src={lastResult.imageUrls[0]} className="w-full h-full object-cover" alt="Leaf" />
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
                      <p className="text-lg font-medium text-gray-900">Upload Images</p>
                      <p className="text-sm text-gray-400">Select one or more leaf images</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="sr-only" />
              </div>

              {lastResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8"
                >
                  <header className="border-b border-gray-100 pb-6">
                    <h3 className="text-2xl font-serif italic text-gray-900 mb-2">Field Summary</h3>
                    <p className="text-gray-600 leading-relaxed">{lastResult.fieldSummary}</p>
                  </header>

                  <div className="space-y-6">
                    {lastResult.analyses.map((analysis: any, idx: number) => (
                      <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{analysis.crop}</h4>
                            <p className="text-emerald-600 font-medium">{analysis.issue}</p>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            analysis.severity >= 4 ? "bg-red-50 text-red-600" : 
                            analysis.severity >= 3 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            Level {analysis.severity} Severity
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Chemical Path</p>
                            <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-emerald-100">
                              <ReactMarkdown>{analysis.chemicalPath}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Organic Path</p>
                            <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-amber-100">
                              <ReactMarkdown>{analysis.organicPath}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Steps to Overcome</p>
                            <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-blue-100">
                              <ReactMarkdown>{analysis.overcomeSteps}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Recommended Pesticides</p>
                            <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-purple-100">
                              <ReactMarkdown>{analysis.pesticides}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Future Crop Advice</p>
                            <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-indigo-100">
                              <ReactMarkdown>{analysis.cropAdvice}</ReactMarkdown>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Weather Context & Recovery</p>
                            <div className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-sky-100">
                              <ReactMarkdown>{analysis.weatherAdvice}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <p className="text-[10px] text-gray-400">Confidence: {analysis.confidence}%</p>
                        </div>
                        
                        {lastResult.imageUrls[idx] && (
                          <div className="mt-4 rounded-xl overflow-hidden h-32 w-full">
                            <img src={lastResult.imageUrls[idx]} alt={`Analysis ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Info size={16} />
                      <span className="text-xs">Analysis by Agricultural Intelligence Assistant</span>
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
              <header className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Analytics Dashboard</p>
                  <h2 className="text-4xl font-serif italic text-gray-900">Farm Intelligence Hub</h2>
                </div>
                {detections.length > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-lg shadow-emerald-100">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">System: Live</span>
                  </div>
                )}
              </header>

              {detections.length > 0 ? (
                <>
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
                              <p className="font-medium text-gray-900">{d.analyses?.[0]?.issue || 'Analysis'}</p>
                              <p className="text-xs text-gray-500">{d.analyses?.[0]?.crop || 'Unknown'} • {new Date(d.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              (d.analyses?.[0]?.severity || 0) >= 4 ? "bg-red-500" : (d.analyses?.[0]?.severity || 0) >= 3 ? "bg-orange-500" : "bg-emerald-500"
                            )} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Real-time Sensors</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Droplets size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Moisture</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">42%</p>
                          <p className="text-[10px] text-blue-600 font-medium">Optimal Range</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                          <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <Thermometer size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Temp</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-900">28°C</p>
                          <p className="text-[10px] text-orange-600 font-medium">Slightly High</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <FlaskConical size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">pH Level</span>
                          </div>
                          <p className="text-2xl font-bold text-emerald-900">6.5</p>
                          <p className="text-[10px] text-emerald-600 font-medium">Perfect Balance</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                          <div className="flex items-center gap-2 text-purple-600 mb-1">
                            <Cloud size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Humidity</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-900">78%</p>
                          <p className="text-[10px] text-purple-600 font-medium">Fungal Risk High</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Live Monitoring</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                              <Eye size={16} />
                            </div>
                            <span className="text-xs font-bold">Drone Status</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                              <Globe size={16} />
                            </div>
                            <span className="text-xs font-bold">Satellite Feed</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase">Live</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                              <WifiOff size={16} className="rotate-180" />
                            </div>
                            <span className="text-xs font-bold">IoT Mesh</span>
                          </div>
                          <span className="text-[10px] font-bold text-orange-600 uppercase">Synced</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Financial ROI</h3>
                      <div className="flex flex-col items-center justify-center h-32">
                        <p className="text-4xl font-bold text-emerald-600">+24.5%</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">Projected ROI Increase</p>
                        <div className="mt-4 flex gap-2">
                          <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-widest rounded-full">Cost -15%</div>
                          <div className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-bold uppercase tracking-widest rounded-full">Yield +12%</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Resource Allocation</h3>
                      <div className="space-y-3">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[65%]" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          <span>Water Usage</span>
                          <span className="text-blue-600">65% Optimized</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full w-[82%]" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          <span>Fertilizer</span>
                          <span className="text-orange-600">82% Precise</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Strategic Control Center</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-emerald-600">
                              <TreeDeciduous size={18} />
                              <span className="text-xs font-bold uppercase tracking-widest">Sustainability Score</span>
                            </div>
                            <span className="text-lg font-bold text-emerald-900">92/100</span>
                          </div>
                          <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full w-[92%]" />
                          </div>
                          <p className="text-[10px] text-emerald-600 mt-2 font-medium">Carbon footprint: 0.2 tCO2e/acre (Excellent)</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-blue-600">
                              <DollarSign size={18} />
                              <span className="text-xs font-bold uppercase tracking-widest">Predictive Trading</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Sell Window Open</span>
                          </div>
                          <p className="text-sm text-blue-900 font-medium">Market prices trending +8% for organic tomatoes. Optimal dispatch: Next 48h.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                              <Scale size={14} />
                              <span className="text-[8px] font-bold uppercase tracking-widest">Compliance</span>
                            </div>
                            <p className="text-xs font-bold text-gray-900">100% Compliant</p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                            <div className="flex items-center gap-2 text-red-600 mb-1">
                              <ShieldAlert size={14} />
                              <span className="text-[8px] font-bold uppercase tracking-widest">Risk Level</span>
                            </div>
                            <p className="text-xs font-bold text-red-900">Low (Stable)</p>
                          </div>
                        </div>
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
                              y: d.analyses?.[0]?.severity || 0,
                              z: (d.analyses?.[0]?.severity || 0) * 20,
                              name: d.analyses?.[0]?.issue || 'Issue'
                            }))}>
                              {detections.map((d, index) => (
                                <Cell key={`cell-${index}`} fill={(d.analyses?.[0]?.severity || 0) >= 4 ? '#EF4444' : (d.analyses?.[0]?.severity || 0) >= 3 ? '#F97316' : '#10B981'} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-center text-gray-400 mt-4 italic">Bubble size indicates severity level</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <BarChart3 size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic text-gray-900 mb-2">{t.noData || "No Data Available"}</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">{t.noDataDesc || "Upload and analyze your first crop image to see real-time farm statistics and analytics."}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('detect')}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-all"
                  >
                    {t.goToDiagnostic || "Go to Diagnostic Engine"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'advanced' && (
            <motion.div 
              key="advanced"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {detections.length > 0 ? (
                renderAdvancedTool()
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <Box size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic text-gray-900 mb-2">{t.advancedLocked || "Advanced Tools Locked"}</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">{t.advancedLockedDesc || "Upload and analyze your first crop image to unlock advanced simulations and farm twin tools."}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('detect')}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-all"
                  >
                    {t.goToDiagnostic || "Go to Diagnostic Engine"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div 
              key="voice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[70vh] flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-md bg-white border border-gray-200 rounded-[3rem] p-12 shadow-xl text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/20">
                  <Volume2 size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-serif italic text-gray-900 mb-2">Your AI Farming Friend</h2>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Live Voice Interaction</p>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  Talk to our AI assistant just like a friend. Ask about your farm, weather, or just say hello in {language}.
                </p>
                <button 
                  onClick={() => setIsVoiceAssistantOpen(true)}
                  className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >
                  <Mic size={24} />
                  Start Call
                </button>
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
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">AI Consultation</p>
                  <h2 className="text-4xl font-serif italic text-gray-900">Plant Doctor</h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                    <Globe size={14} className="text-emerald-600" />
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                        showHistory ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                    >
                      {showHistory ? "Current Chat" : "History"}
                    </button>
                    <button 
                      onClick={clearChat}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      New Chat
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {(!showHistory && chatMessages.filter(m => m.createdAt >= sessionStartTime).length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                      <Bot size={40} />
                    </div>
                    <h3 className="text-2xl font-serif italic text-gray-900 mb-2">New Consultation</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Upload a photo of your crop or ask me anything about farming in {language}.</p>
                  </div>
                )}
                {(showHistory ? chatMessages : chatMessages.filter(m => m.createdAt >= sessionStartTime)).map((m: any, i: number) => (
                  <div key={i} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                      m.role === 'user' ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"
                    )}>
                      {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                      m.role === 'user' ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-900 rounded-tl-none"
                    )}>
                      <ReactMarkdown>{m.content || m.fieldSummary || "Analysis result"}</ReactMarkdown>
                      {m.role === 'model' && (
                        <button 
                          onClick={() => speak(m.content)}
                          className="mt-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none flex gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                {chatImage && (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-emerald-200 group">
                    <img 
                      src={`data:${chatImage.type};base64,${chatImage.data}`} 
                      className="w-full h-full object-cover" 
                      alt="Preview" 
                    />
                    <button 
                      onClick={() => setChatImage(null)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsVoiceAssistantOpen(true)}
                    className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                    title="Live Voice Assistant"
                  >
                    <Volume2 size={24} />
                  </button>
                  <button 
                    onClick={() => chatImageInputRef.current?.click()}
                    className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center transition-all hover:bg-emerald-100"
                    title="Upload Image"
                  >
                    <Camera size={24} />
                  </button>
                  <input 
                    ref={chatImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChatImageUpload}
                    className="sr-only"
                  />
                  <button 
                    onClick={toggleVoice}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    isVoiceActive ? "bg-red-500 text-white animate-pulse" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  )}
                >
                  <Mic size={24} />
                </button>
                <input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isVoiceActive ? "Listening..." : "Ask the doctor..."}
                  className="flex-1 bg-white border border-gray-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatting || !newMessage.trim()}
                  className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Alarm Triggered Modal */}
        <AnimatePresence>
          {activeAlarm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <Bell size={40} />
                </div>
                <h2 className="text-3xl font-serif italic text-gray-900 mb-2">{t.wakeUp}</h2>
                <p className="text-gray-500 mb-6 font-medium uppercase tracking-widest text-[10px]">Time for your farming tasks</p>
                
                <div className="bg-gray-50 rounded-2xl p-4 mb-8">
                  <p className="text-4xl font-black text-gray-900 mb-1">{formatTimeAMPM(activeAlarm.time)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(activeAlarm.date).toLocaleDateString()}</p>
                </div>

                <button 
                  onClick={() => setActiveAlarm(null)}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {t.dismiss}
                </button>
              </motion.div>
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
