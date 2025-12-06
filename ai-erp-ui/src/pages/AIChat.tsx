import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, X, Loader2, Languages, BookOpen, AlertCircle, Zap, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import { sendChatMessage, batchQuery, ChatResponse, BatchQueryResponse } from '../services/api';
import { useModel } from '../contexts/ModelContext';
import ModelSelector from '../components/ModelSelector';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sources?: Array<{
    index: number;
    source: string;
    category: string;
    content_preview: string;
  }>;
  error?: boolean;
  isBatch?: boolean;
  batchResults?: Array<{
    question: string;
    answer: string;
  }>;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchQueries, setBatchQueries] = useState('');
  const [showModelSettings, setShowModelSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use model context
  const { selectedModel, useLLM, setSelectedModel, setUseLLM } = useModel();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'hi', name: 'हिंदी' },
  ];

  const suggestedQuestions = [
    "What are the main risks in our ERP system?",
    "Show me the readiness score",
    "What are the top pain points?",
    "List security vulnerabilities",
    "Summarize the modernization assessment"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setConnectionError(false);

    try {
      // Call real RAG API with model settings
      const response: ChatResponse = await sendChatMessage(currentInput, selectedModel, useLLM);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        sender: 'ai',
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionError(true);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error connecting to the server. Please ensure:\n\n1. The API server is running (python api_server.py)\n2. The vector store has been created (run analysis first)\n3. The server is accessible at http://localhost:8000\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'ai',
        timestamp: new Date(),
        error: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchQuery = async () => {
    if (!batchQueries.trim()) return;

    const queries = batchQueries
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    if (queries.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Batch Query (${queries.length} questions):\n${queries.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setBatchQueries('');
    setShowBatchModal(false);
    setIsLoading(true);
    setConnectionError(false);

    try {
      const response: BatchQueryResponse = await batchQuery(queries);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Batch Query Results (${response.queries_count} questions processed)`,
        sender: 'ai',
        timestamp: new Date(response.timestamp),
        isBatch: true,
        batchResults: response.results,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing batch query:', error);
      setConnectionError(true);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Failed to process batch query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'ai',
        timestamp: new Date(),
        error: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Simulate file upload
    setTimeout(() => {
      const uploadMessage: Message = {
        id: Date.now().toString(),
        content: `File uploaded: ${file.name}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, uploadMessage]);
      setIsUploading(false);
    }, 1500);
  };

  // return (
  //   <div className="ai-chat-container h-full">
      // <div className="chat-header">
      //   <div className="flex items-center">
      //     <div className="ai-avatar">
      //       <div className="ai-dot"></div>
      //       <div className="ai-dot delay-200"></div>
      //       <div className="ai-dot delay-400"></div>
      //     </div>
      //     <h2>ERP AI Assistant</h2>
      //   </div>
      //   <div className="language-selector">
      //     <button 
      //       onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
      //       className="language-button"
      //     >
      //       <Languages className="h-4 w-4" />
      //       <span>{languages.find(lang => lang.code === selectedLanguage)?.code.toUpperCase()}</span>
      //     </button>
      //     {showLanguageDropdown && (
      //       <div className="language-dropdown">
      //         {languages.map((lang) => (
      //           <button
      //             key={lang.code}
      //             onClick={() => {
      //               setSelectedLanguage(lang.code);
      //               setShowLanguageDropdown(false);
      //             }}
      //             className={cn(
      //               'language-option',
      //               selectedLanguage === lang.code && 'active'
      //             )}
      //           >
      //             {lang.name}
      //           </button>
      //         ))}
      //       </div>
      //     )}
      //   </div>
      // </div>

  //     <div className="chat-messages">
  //       {messages.length === 0 ? (
  //         <div className="empty-state">
  //           <div className="empty-icon">💡</div>
  //           <h3>How can I help you today?</h3>
  //           <p>Ask me anything about your ERP data or upload a file for analysis.</p>
  //         </div>
  //       ) : (
  //         <AnimatePresence>
  //           {messages.map((message) => (
  //             <motion.div
  //               key={message.id}
  //               className={cn(
  //                 'message',
  //                 message.sender === 'ai' ? 'ai-message' : 'user-message'
  //               )}
  //               initial={{ opacity: 0, y: 20 }}
  //               animate={{ opacity: 1, y: 0 }}
  //               exit={{ opacity: 0, x: message.sender === 'user' ? 100 : -100 }}
  //               transition={{ duration: 0.3 }}
  //             >
  //               <div className="message-content">
  //                 {message.content}
  //                 <div className="message-time">
  //                   {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  //                 </div>
  //               </div>
  //             </motion.div>
  //           ))}
  //           <div ref={messagesEndRef} />
  //         </AnimatePresence>
  //       )}
  //     </div>

  //     {/* <form onSubmit={handleSendMessage} className="chat-input-container">
  //       <div className="file-upload">
  //         <input
  //           type="file"
  //           id="file-upload"
  //           className="hidden"
  //           onChange={handleFileUpload}
  //           disabled={isUploading}
  //         />
  //         <label htmlFor="file-upload" className="upload-button">
  //           {isUploading ? (
  //             <Loader2 className="h-5 w-5 animate-spin" />
  //           ) : (
  //             <Paperclip className="h-5 w-5" />
  //           )}
  //         </label>
  //       </div>
  //       <input
  //         type="text"
  //         value={input}
  //         onChange={(e) => setInput(e.target.value)}
  //         placeholder={`Message in ${languages.find(lang => lang.code === selectedLanguage)?.name}...`}
  //         className="chat-input"
  //         disabled={isLoading}
  //       />
  //       <button
  //         type="submit"
  //         className="send-button"
  //         disabled={!input.trim() || isLoading}
  //       >
  //         {isLoading ? (
  //           <Loader2 className="h-5 w-5 animate-spin" />
  //         ) : (
  //           <Send className="h-5 w-5" />
  //         )}
  //       </button>
  //     </form> */}

  //     {/* Add this above the form */}
  //     <div className="px-4 pt-2">
  //       {isLoading && (
  //         <div className="typing-indicator">
  //           <span>AI is typing</span>
  //           <span className="typing-dot"></span>
  //           <span className="typing-dot"></span>
  //           <span className="typing-dot"></span>
  //         </div>
  //       )}
        
  //       {/* Example suggestions (you can make these dynamic) */}
  //       <div className="suggestions-container">
  //         <button className="suggestion-chip">Show me sales data</button>
  //         <button className="suggestion-chip">Analyze last quarter</button>
  //         <button className="suggestion-chip">Generate report</button>
  //       </div>
  //     </div>

  //     <form onSubmit={handleSendMessage} className="chat-input-container">
  //       <div className="input-wrapper">
  //         <input
  //           type="text"
  //           value={input}
  //           onChange={(e) => setInput(e.target.value)}
  //           placeholder={`Message in ${languages.find(lang => lang.code === selectedLanguage)?.name}...`}
  //           className="chat-input"
  //           disabled={isLoading}
  //           onKeyDown={(e) => {
  //             if (e.key === 'Enter' && !e.shiftKey) {
  //               e.preventDefault();
  //               handleSendMessage(e);
  //             }
  //           }}
  //         />
  //         <div className="input-actions">
  //           <div className="file-upload">
  //             <input
  //               type="file"
  //               id="file-upload"
  //               className="hidden"
  //               onChange={handleFileUpload}
  //               disabled={isUploading}
  //             />
  //             <label htmlFor="file-upload" className="upload-button">
  //               {isUploading ? (
  //                 <Loader2 className="h-4 w-4 animate-spin" />
  //               ) : (
  //                 <Paperclip className="h-4 w-4" />
  //               )}
  //             </label>
  //           </div>
            
  //           {/* Add emoji picker button (you'll need to implement the emoji picker functionality) */}
  //           <button type="button" className="emoji-button">
  //             <span role="img" aria-label="Emoji">😊</span>
  //           </button>
            
  //           <button
  //             type="submit"
  //             className="send-button"
  //             disabled={!input.trim() || isLoading}
  //           >
  //             {isLoading ? (
  //               <Loader2 className="h-4 w-4 animate-spin" />
  //             ) : (
  //               <Send className="h-4 w-4" />
  //             )}
  //           </button>
  //         </div>
  //       </div>
  //     </form>
  //   </div>
  // );

  return (
    <div className="ai-chat-container">
      {/* <div className="chat-header">
        <div className="flex items-center">
          <div className="ai-avatar">
            <div className="ai-dot"></div>
            <div className="ai-dot delay-200"></div>
            <div className="ai-dot delay-400"></div>
          </div>
          <h2>ERP AI Assistant</h2>
        </div>
        <div className="language-selector">
          <button 
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="language-button"
          >
            <Languages className="h-4 w-4" />
            <span>{languages.find(lang => lang.code === selectedLanguage)?.code.toUpperCase()}</span>
          </button>
          {showLanguageDropdown && (
            <div className="language-dropdown">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguageDropdown(false);
                  }}
                  className={cn(
                    'language-option',
                    selectedLanguage === lang.code && 'active'
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div> */}
      <div className="chat-messages">
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💡</div>
              <h3>How can I help you today?</h3>
              <p>Ask me anything about your ERP data or upload a file for analysis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={cn(
                      'message',
                      message.sender === 'ai' ? 'ai-message' : 'user-message',
                      message.error && 'error-message'
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="message-content">
                      {message.isBatch && message.batchResults ? (
                        <div className="space-y-4">
                          <p className="font-semibold text-cyan-400 mb-3">{message.content}</p>
                          {message.batchResults.map((result, idx) => (
                            <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                              <p className="text-white font-semibold mb-2">Q{idx + 1}: {result.question}</p>
                              <p className="text-slate-300 text-sm">{result.answer}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {message.content.split('\n').map((line, idx) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </>
                      )}
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions and typing indicator */}
      <div className="suggestions-wrapper">
        {isLoading && (
          <div className="typing-indicator">
            <span>AI is typing</span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        )}
        
         <div className="suggestions-container">
            <button 
              className="suggestion-chip"
              onClick={() => setInput(prev => prev + "Show me sales data")}
            >
              Show me sales data
            </button>
            <button 
              className="suggestion-chip"
              onClick={() => setInput(prev => prev + "Analyze last quarter")}
            >
              Analyze last quarter
            </button>
            <button 
              className="suggestion-chip"
              onClick={() => setInput(prev => prev + "Generate report")}
            >
              Generate report
            </button>
          </div>
      </div>

      {/* Input container - fixed at bottom */}
      <div className="chat-input-container">
        <div className="input-outer-wrapper">
          <form onSubmit={handleSendMessage} className="input-wrapper">
            <div className="input-actions-left">
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Batch Query"
              >
                <Zap className="h-5 w-5" />
              </button>
              <div className="language-selector">
                <button 
                  type="button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="language-button"
                >
                  <Languages className="h-4 w-4" />
                  <span>{languages.find(lang => lang.code === selectedLanguage)?.code.toUpperCase()}</span>
                </button>
                {showLanguageDropdown && (
                  <div className="language-dropdown">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(lang.code);
                          setShowLanguageDropdown(false);
                        }}
                        className={cn(
                          'language-option',
                          selectedLanguage === lang.code && 'active'
                        )}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ModelSelector
                compact
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                useLLM={useLLM}
                onUseLLMChange={setUseLLM}
              />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message in ${languages.find(lang => lang.code === selectedLanguage)?.name}...`}
              className="chat-input"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <div className="input-actions">
              <div className="file-upload">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="upload-button">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </label>
              </div>
              
              <button
                type="submit"
                className="send-button"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Batch Query Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowBatchModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-800 rounded-xl border border-slate-700 p-6 z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">Batch Query</h2>
                </div>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Enter multiple questions (one per line) to get answers in batch
              </p>
              <textarea
                value={batchQueries}
                onChange={(e) => setBatchQueries(e.target.value)}
                placeholder="What are the main risks?&#10;Show me the readiness score&#10;List top pain points"
                className="w-full h-48 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchQuery}
                  disabled={!batchQueries.trim() || isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      <span>Process Batch</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChat;