// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart2,
  Activity, 
  AlertCircle,
  Zap,
  FileText,
  Upload,
  Loader2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RiskHeatMap from './pages/RiskHeatmap';
import AIChat from './pages/AIChat';
import KnowledgeBase from './pages/KnowledgeBase';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import UploadModal from './components/UploadModel';
import { ModelProvider } from './contexts/ModelContext';
import { cn } from './utils/cn';
import './styles/globals.css';

// Custom hook to handle active tab state based on route
const useActiveTab = () => {
  const location = useLocation();
  const path = location.pathname.substring(1) || 'dashboard';
  return path === '' ? 'dashboard' : path;
};

function App() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const activeTab = useActiveTab();
  const location = useLocation();

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    const handleRouteChange = () => {
      setIsLoading(true);
      // Simulate loading time
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('scroll', handleScroll);
    const cleanup = handleRouteChange();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (cleanup) cleanup();
    };
  }, [location]);

  const handleUpload = async (file: File) => {
    console.log('Uploading file:', file.name);
    setIsLoading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress > 100) progress = 100;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowUploadModal(false);
          setIsLoading(false);
          showNotification('File uploaded successfully!', 'success');
          setTimeout(() => setUploadProgress(0), 300);
        }, 800);
      }
    }, 200);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type} slide-in`;
    notification.textContent = message;
    
    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('slide-in');
      notification.classList.add('slide-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'risk', icon: AlertCircle, label: 'Value Stream Analysis' },
    { id: 'ai', icon: Zap, label: 'AI Assistant' },
    { id: 'knowledge', icon: BookOpen, label: 'Knowledge Base' },
    { id: 'insights', icon: BarChart2, label: 'Insights' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ] as const;

  return (
    <div className="app-container">
      <Header 
        onUploadClick={() => setShowUploadModal(true)} 
        className={cn(isScrolled && 'shadow-md bg-opacity-90 backdrop-blur-sm')}
      />
      
      <main className="main-content">
        <nav className="sticky top-16 z-30 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                {navItems.map(({ id, icon: Icon, label }) => (
                  <Link
                    key={id}
                    to={`/${id === 'dashboard' ? '' : id}`}
                    className={cn(
                      'group relative px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                      activeTab === id 
                        ? 'text-cyan-400' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    )}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </div>
                    {activeTab === id && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                        layoutId="activeTab"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                ))}
              </div>
              
              <motion.button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Data
              </motion.button>
            </div>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
              </div>
            ) : (
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/risk" element={<RiskHeatMap />} />
                <Route path="/ai" element={<AIChat />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => {
          setShowUploadModal(false);
          setUploadProgress(0);
        }}
      />

      <div id="notification-container" className="fixed bottom-4 right-4 z-50 space-y-2"></div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <ModelProvider>
      <App />
    </ModelProvider>
  );
}