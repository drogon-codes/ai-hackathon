// src/components/Header.tsx
import { Activity, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import '../styles/components.css';

interface HeaderProps {
  onUploadClick: () => void;
  className?: string;
}

const Header = ({ onUploadClick, className }: HeaderProps) => {
  return (
    <motion.header 
      className={cn('header', className)}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-container">
        <div className="logo-container group">
          <motion.div 
            className="logo-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity className="h-6 w-6" />
          </motion.div>
          <div className="logo-text">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              ERP Pulse AI
            </motion.h1>
            <motion.p 
              className="text-slate-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Zero Risk Modernization
            </motion.p>
          </div>
        </div>
        {/* <motion.button 
          onClick={onUploadClick} 
          className="upload-btn group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span 
            className="upload-icon"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <Upload className="h-4 w-4" />
          </motion.span>
          <span className="ml-2">Upload ERP Data</span>
        </motion.button> */}
      </div>
    </motion.header>
  );
};

export default Header;