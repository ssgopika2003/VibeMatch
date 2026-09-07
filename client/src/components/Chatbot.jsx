import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  Sparkles, 
  ShoppingBag, 
  AlertCircle, 
  Loader, 
  Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import axios from 'axios';

const formatAiErrorMessage = (message) => {
  const text = String(message || '');
  const lowerText = text.toLowerCase();

  if (lowerText.includes('gemini quota or rate limit reached') || lowerText.includes('quota exceeded for metric')) {
    return 'AI chat is temporarily unavailable because the Gemini free-tier quota is exhausted. Please upgrade this Gemini project to a paid or billing-enabled plan, switch to another API key with quota, or enable a fallback provider like Ollama.';
  }

  return text || 'Failed to get response. Please try again.';
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [provider, setProvider] = useState('none');
  const [error, setError] = useState(null);
  const [chatMode, setChatMode] = useState('ask'); // 'ask', 'products'
  const [contextData, setContextData] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { token, user } = useStore();

  // Debug logging
  useEffect(() => {
    console.log('🤖 Chatbot - Auth State:', { 
      hasToken: !!token, 
      hasUser: !!user,
      userName: user?.name 
    });
  }, [token, user]);

  useEffect(() => {
    console.log('🤖 Chatbot - AI State:', { 
      isEnabled, 
      provider 
    });
  }, [isEnabled, provider]);

  // Check AI status on mount
  useEffect(() => {
    if (token) {
      console.log('🤖 Chatbot - Checking AI status...');
      checkAIStatus();
      loadChatHistory();
    } else {
      console.log('🤖 Chatbot - No token, skipping AI check');
    }
  }, [token]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAIStatus = async () => {
    try {
      console.log('🤖 Chatbot - Fetching AI status from server...');
      const response = await axios.get('http://localhost:5000/api/chat/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('🤖 Chatbot - AI Status Response:', response.data);
      setIsEnabled(response.data.enabled);
      setProvider(response.data.provider);
    } catch (err) {
      console.error('🤖 Chatbot - Error checking AI status:', err.response?.data || err.message);
      setIsEnabled(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const loadProductsContext = async () => {
    const response = await axios.get('http://localhost:5000/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const productsList = response.data.products || response.data || [];

    return productsList
      .filter(p => p.available !== false)
      .map(p => {
        let imageUrl = null;
        if (p.images && p.images.length > 0) {
          const firstImage = p.images[0];
          imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
        }

        return {
          _id: p._id,
          name: p.name,
          price: p.discountPrice || p.price,
          images: p.images,
          image: imageUrl,
          available: p.available,
          category: p.category || '',
          subcategory: p.subcategory || '',
          silhouette: p.silhouette || '',
          description: p.description || '',
          vibeTags: p.vibeTags || []
        };
      });
  };

  // Quick action handlers
  const handleQuickAction = async (action) => {
    setError(null);
    
    if (action === 'products') {
      setChatMode('products');
      try {
        const availableProducts = await loadProductsContext();
        
        setContextData(availableProducts);
        
        // Add system message
        const systemMsg = {
          role: 'assistant',
          content: "I can see our current products! Ask me about styles, recommendations, or specific items you're looking for.",
          metadata: { mode: 'products' },
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, systemMsg]);
        
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products. Please try again.');
      }
    } else {
      setChatMode('ask');
      try {
        const availableProducts = await loadProductsContext();
        setContextData(availableProducts);
      } catch (err) {
        console.error('Error loading products for ask mode:', err);
        setContextData(null);
      }
    }
    
    setIsOpen(true);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build request payload
      const payload = {
        message: input.trim(),
        mode: chatMode
      };

      // Include product data for product-aware suggestions in both ask and products mode
      if (contextData && contextData.length > 0) {
        payload.products = contextData;
      }

      console.log('🤖 Chatbot Payload Sending:', payload);

      // Check if we should use streaming (Ollama)
      if (provider === 'ollama') {
        await handleStreamingResponse(payload);
      } else {
        await handleStandardResponse(payload);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(formatAiErrorMessage(err.message));
      setIsLoading(false);
    }
  };

  const handleStandardResponse = async (payload) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/chat/message',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      console.log('🤖 AI Response:', {
        message: response.data.message,
        productRefs: response.data.productRefs,
        products: response.data.products
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        metadata: {
          products: response.data.products || [],
          productRefs: response.data.productRefs || [],
          provider: response.data.provider,
          mode: chatMode
        },
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (err) {
      throw new Error(formatAiErrorMessage(err.response?.data?.message || err.message));
    }
  };

  const handleStreamingResponse = async (payload) => {
    let streamedContent = '';
    const assistantMessage = {
      role: 'assistant',
      content: '',
      metadata: { 
        products: [], 
        productRefs: [],
        provider: 'ollama', 
        mode: chatMode 
      },
      createdAt: new Date().toISOString(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('http://localhost:5000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Streaming request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.message);
              }
              
              if (data.chunk) {
                streamedContent += data.chunk;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content = streamedContent;
                  }
                  return newMessages;
                });
              }
              
              if (data.done) {
                console.log('🤖 Stream Complete:', {
                  message: data.fullResponse,
                  productRefs: data.productRefs,
                  products: data.products
                });
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.role === 'assistant') {
                    lastMsg.content = data.fullResponse;
                    lastMsg.metadata.products = data.products || [];
                    lastMsg.metadata.productRefs = data.productRefs || [];
                    delete lastMsg.isStreaming;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err) {
      setMessages(prev => prev.slice(0, -1)); // Remove streaming message
      throw err;
    }
  };

  // Find products mentioned in AI response by name
  const findMentionedProducts = (message, products) => {
    if (!message || !products) return [];
    
    const mentioned = [];
    const lowerMessage = message.toLowerCase();
    
    for (const product of products) {
      const productName = product.name.toLowerCase();
      
      // Check if product name appears in message
      if (lowerMessage.includes(productName)) {
        mentioned.push(product);
      }
    }
    
    return mentioned;
  };

  // Render message content with clickable product references
  const renderMessageContent = (content, products = [], productRefs = []) => {
    const refs = Array.isArray(productRefs) ? productRefs : [];
    const items = Array.isArray(products) ? products : [];

    if (items.length === 0 && refs.length === 0) {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }

    // Replace p{number} with styled inline badges
    const parts = [];
    const regex = /p\{(\d+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add product reference badge
      const productNum = parseInt(match[1]);
      const refEntry = refs.find((p) => {
        if (typeof p === 'number') return p === productNum;
        if (typeof p === 'object' && p !== null) return p.number === productNum;
        return false;
      });

      const productFromRefObject =
        typeof refEntry === 'object' && refEntry !== null ? refEntry : null;

      const productFromItemsByNumber = items.find((p) => p?.number === productNum);
      const productFromItemsByIndex = items[productNum - 1];
      const productFromContext = Array.isArray(contextData) ? contextData[productNum - 1] : null;

      const product =
        productFromRefObject ||
        productFromItemsByNumber ||
        productFromItemsByIndex ||
        productFromContext;
      
      if (product) {
        const targetProductId = product.productId || product._id || product.id;
        const productLabel = product.name || `Product ${productNum}`;

        parts.push(
          <span
            key={`p-${match.index}`}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium accent-bg text-white mx-1 cursor-pointer hover:opacity-80"
            onClick={() => {
              if (!targetProductId) return;
              navigate(`/products/${targetProductId}`);
              setIsOpen(false);
            }}
          >
            {productLabel}
          </span>
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return <p className="text-sm whitespace-pre-wrap">{parts}</p>;
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your chat history?')) return;

    try {
      await axios.delete('http://localhost:5000/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages([]);
      setChatMode('ask');
      setContextData(null);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render if not logged in or AI disabled
  if (!token || !user) {
    console.log('🤖 Chatbot - Not rendering: No token or user');
    return null;
  }
  if (!isEnabled) {
    console.log('🤖 Chatbot - Not rendering: AI not enabled');
    return null;
  }

  console.log('🤖 Chatbot - Rendering chatbot button/window');

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 accent-bg rounded-full shadow-2xl flex items-center justify-center btn-glow"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] glass-strong rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="accent-bg px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-semibold text-white">VibeMatch AI</h3>
                  <p className="text-xs text-white/80">
                    {provider === 'ollama' ? 'Local AI' : 'Powered by AI'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClearHistory}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="px-4 py-3 border-b border-white/10 flex gap-2">
              <button
                onClick={() => handleQuickAction('ask')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  chatMode === 'ask'
                    ? 'accent-bg text-white'
                    : 'glass hover:glass-strong'
                }`}
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                Ask AI
              </button>
              <button
                onClick={() => handleQuickAction('products')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  chatMode === 'products'
                    ? 'accent-bg text-white'
                    : 'glass hover:glass-strong'
                }`}
              >
                <ShoppingBag className="w-3 h-3 inline mr-1" />
                Products
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Ask me anything about VibeMatch!</p>
                  <p className="text-xs mt-2">Style advice • Product recommendations</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'accent-bg text-white'
                        : 'glass border border-white/10'
                    }`}
                  >
                    {renderMessageContent(msg.content, msg.metadata?.products, msg.metadata?.productRefs)}
                    
                    {msg.isStreaming && (
                      <Loader className="w-4 h-4 animate-spin mt-2" />
                    )}

                    {/* Product Cards (referenced products) */}
                    {msg.metadata?.products?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.metadata.products.map((product, pidx) => {
                          // Extract image URL - handle string or object with url property
                          let productImage = null;
                          if (product.image) {
                            productImage = typeof product.image === 'string' ? product.image : product.image.url;
                          } else if (product.images && product.images.length > 0) {
                            const firstImage = product.images[0];
                            productImage = typeof firstImage === 'string' ? firstImage : firstImage?.url;
                          }

                          return (
                            <div
                              key={pidx}
                              className="flex items-center space-x-3 p-3 glass hover:glass-strong rounded-lg transition cursor-pointer group border border-white/5"
                              onClick={() => {
                                navigate(`/products/${product.productId}`);
                                setIsOpen(false);
                              }}
                            >
                              {productImage ? (
                                <img 
                                  src={productImage} 
                                  alt={product.name}
                                  className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-14 h-14 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{ display: productImage ? 'none' : 'flex' }}
                              >
                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover:accent-text transition">
                                  {product.name}
                                </p>
                                <p className="text-xs accent-text font-semibold mt-0.5">₹{product.price}</p>
                              </div>
                              <ShoppingBag className="w-4 h-4 text-gray-400 group-hover:accent-text transition flex-shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-end space-x-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    chatMode === 'products' 
                      ? "Ask about styles or products..." 
                        : "Ask about styles and products..."
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:border-white/20 transition min-h-[40px] max-h-[120px]"
                  rows={1}
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`p-3 rounded-xl transition ${
                    isLoading || !input.trim()
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'accent-bg text-white btn-glow'
                  }`}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
