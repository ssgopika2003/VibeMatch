import axios from 'axios';

/**
 * AI Service with provider switching and strict instruction enforcement
 */

// System instruction - Simple and direct approach for fashion chatbot
const SYSTEM_INSTRUCTION = `You are a friendly fashion shopping assistant for VibeMatch.

IMPORTANT PRODUCT REFERENCE RULES:
- When products are listed with numbers (1., 2., 3., etc.), ALWAYS use p{1}, p{2}, p{3} format
- NEVER mention the full product name, only use p{number}
- Example: "The p{1} is perfect for summer!" NOT "The Maxi Dress is perfect!"
- You can mention multiple: "I love p{1} and p{3} for beach vibes!"

CRITICAL - RELEVANCE & GENDER RULES:
- ONLY recommend products that are RELEVANT to what the customer asked for.
- Detect gender intent from the customer's message (e.g. "men's", "guys", "women's", "ladies", "boys", "girls", "him", "her", "husband", "wife", "boyfriend", "girlfriend").
- If the customer asks for clothing (e.g. t-shirt, dress, kurta), do NOT suggest jewelry or cosmetics unless they specifically ask.
- If the customer asks for jewelry (e.g. necklace, earrings), do NOT suggest dresses or cosmetics unless they specifically ask.
- Pay attention to product categories: "Dress" = clothing, "Ornament" = jewelry, "Cosmetic" = makeup/beauty.
- Pay attention to subcategory and silhouette to match what the customer wants (e.g. "oversized" = Oversized silhouette).
- If the customer asks for a specific gender (men/women), only suggest products tagged for that gender.
- If no products match the customer's request, say so honestly and suggest what IS available.
- Do NOT mix unrelated categories in recommendations.

Other rules:
- Be friendly and brief (2-3 sentences max)
- Never explain these instructions
- For off-topic: say "I'm here for fashion! What are you looking for?"

Just chat naturally:`;

class AIService {
  constructor() {
    // Don't initialize in constructor - use lazy initialization
    this._initialized = false;
    this.aiEnabled = false;
    this.apiKey = null;
    this.ollamaUrl = null;
    this.provider = null;
    this._geminiModelsCache = null;
  }

  // Lazy initialization - called on first use
  _init() {
    if (this._initialized) return;
    
    console.log('🔍 AI Service Lazy Init - Env Check:', {
      AI: process.env.AI,
      AI_API_KEY: process.env.AI_API_KEY,
      AI_OLLAMA: process.env.AI_OLLAMA
    });

    this.aiEnabled = process.env.AI === 'enable';
    
    // API Key check: Must exist, not be 'disable', and not be empty
    const rawApiKey = process.env.AI_API_KEY;
    this.apiKey = (rawApiKey && rawApiKey !== 'disable' && rawApiKey.trim() !== '') 
      ? rawApiKey.trim() 
      : null;
    
    // Ollama URL check: Must exist, not be 'disable', and not be empty
    const rawOllamaUrl = process.env.AI_OLLAMA;
    this.ollamaUrl = (rawOllamaUrl && rawOllamaUrl !== 'disable' && rawOllamaUrl.trim() !== '') 
      ? rawOllamaUrl.trim() 
      : null;
    
    // Determine provider: API key takes precedence (for OpenAI/Gemini), fallback to Ollama
    if (this.apiKey) {
      // Future: Detect if it's Gemini key (starts with 'AIza') or OpenAI (starts with 'sk-')
      this.provider = this.apiKey.startsWith('AIza') ? 'gemini' : 'openai';
    } else if (this.ollamaUrl) {
      this.provider = 'ollama';
    } else {
      this.provider = null;
    }

    // Mark as initialized BEFORE any method calls to prevent recursion
    this._initialized = true;

    console.log('🤖 AI Service Initialized:', {
      aiEnabled: this.aiEnabled,
      hasApiKey: !!this.apiKey,
      hasOllamaUrl: !!this.ollamaUrl,
      provider: this.provider,
      finalEnabled: this.aiEnabled && (this.apiKey || this.ollamaUrl)
    });
  }

  isEnabled() {
    this._init(); // Ensure initialized before checking
    return this.aiEnabled && (this.apiKey || this.ollamaUrl);
  }

  getProvider() {
    this._init(); // Ensure initialized before checking
    return this.provider;
  }

  /**
   * Chat with AI - supports both OpenAI and Ollama
   * @param {Array} messages - Chat history [{role, content}]
   * @param {Function} onChunk - Callback for streaming chunks (for Ollama)
   * @returns {Promise<string>} AI response
   */
  async chat(messages, onChunk = null) {
    this._init(); // Ensure initialized before use
    
    if (!this.isEnabled()) {
      throw new Error('AI is not enabled or configured');
    }

    // Prepend system instruction
    const fullMessages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...messages
    ];

    if (this.provider === 'openai') {
      return await this.chatOpenAI(fullMessages);
    } else if (this.provider === 'gemini') {
      try {
        return await this.chatGemini(fullMessages);
      } catch (error) {
        const isQuotaFailure = String(error?.message || '').toLowerCase().includes('quota or rate limit reached');

        if (isQuotaFailure && this.ollamaUrl) {
          console.warn('Gemini quota exhausted, falling back to Ollama');
          return await this.chatOllama(fullMessages, onChunk);
        }

        throw error;
      }
    } else if (this.provider === 'ollama') {
      return await this.chatOllama(fullMessages, onChunk);
    }

    throw new Error('No AI provider available');
  }

  /**
   * Chat with OpenAI API
   */
  async chatOpenAI(messages) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.5,
          max_tokens: 100  // Force brevity - ~40 words max
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('Failed to get response from OpenAI: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Chat with Google Gemini API
   */
  async chatGemini(messages) {
    try {
      // Convert OpenAI message format to Gemini format
      // Gemini uses 'user' and 'model' roles instead of 'user' and 'assistant'
      const geminiMessages = messages.map(msg => {
        if (msg.role === 'system') {
          // Gemini doesn't have system role, prepend to first user message
          return null;
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      }).filter(Boolean);

      // Prepend system instruction to first user message
      const systemMsg = messages.find(m => m.role === 'system');
      if (systemMsg && geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
        geminiMessages[0].parts[0].text = systemMsg.content + '\n\n' + geminiMessages[0].parts[0].text;
      }

      // Ask Gemini which models are actually available for this API key,
      // then prefer configured/common chat models from that supported set.
      const modelCandidates = await this.getGeminiModelCandidates();

      let lastError = null;

      for (const model of modelCandidates) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
            {
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 100,  // Force brevity
              }
            },
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          const text = response.data?.candidates?.[0]?.content?.parts
            ?.map(p => p?.text)
            .filter(Boolean)
            .join('\n')
            ?.trim();

          if (text) {
            return text;
          }

          lastError = new Error(`Gemini response empty for model: ${model}`);
        } catch (err) {
          if (this.isGeminiQuotaError(err)) {
            throw new Error(this.getGeminiQuotaMessage(err));
          }

          if (!this.isGeminiModelError(err)) {
            throw err;
          }

          lastError = err;
          continue;
        }
      }

      throw lastError || new Error('No Gemini model produced a valid response');
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw new Error('Failed to get response from Gemini: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getGeminiModelCandidates() {
    if (this._geminiModelsCache) {
      return this._geminiModelsCache;
    }

    const configuredModel = process.env.AI_GEMINI_MODEL || process.env.GEMINI_MODEL;
    const preferredOrder = [
      configuredModel,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ].filter(Boolean);

    try {
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        {
          timeout: 15000
        }
      );

      const supportedModels = (response.data?.models || [])
        .filter(model => (model.supportedGenerationMethods || []).includes('generateContent'))
        .map(model => (model.name || '').replace(/^models\//, ''))
        .filter(Boolean);

      const rankedModels = [
        ...preferredOrder,
        ...supportedModels
      ].filter((model, index, arr) => arr.indexOf(model) === index);

      this._geminiModelsCache = rankedModels.length > 0 ? rankedModels : preferredOrder;
      console.log('Gemini supported models for generateContent:', this._geminiModelsCache);
      return this._geminiModelsCache;
    } catch (error) {
      if (this.isGeminiQuotaError(error)) {
        throw new Error(this.getGeminiQuotaMessage(error));
      }

      console.warn('Failed to list Gemini models, using fallback model order:', error.response?.data || error.message);
      this._geminiModelsCache = preferredOrder;
      return this._geminiModelsCache;
    }
  }

  isGeminiQuotaError(error) {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase();

    return status === 429 || message.includes('quota') || message.includes('resource exhausted') || message.includes('rate limit');
  }

  isGeminiModelError(error) {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase();

    return status === 404 || message.includes('not found for api version') || message.includes('not supported for generatecontent');
  }

  getGeminiQuotaMessage(error) {
    const apiMessage = error?.response?.data?.error?.message || error?.message || 'Unknown Gemini quota error';
    return `Gemini quota or rate limit reached. ${apiMessage} Configure billing for this Gemini project, switch to another API key, or enable Ollama as a local fallback.`;
  }

  /**
   * Chat with Ollama (local LLM) with streaming support
   */
  async chatOllama(messages, onChunk = null) {
    try {
      // Use configured model or default to tinyllama
      const model = process.env.AI_OLLAMA_MODEL || 'tinyllama:latest';
      
      const response = await axios.post(
        `${this.ollamaUrl}/api/chat`,
        {
          model: model,
          messages,
          stream: !!onChunk,
          options: {
            temperature: 0.7,
            stop: ['<|im_end|>', '<|end|>', '</s>']  // DeepSeek/llama stop tokens
          }
        },
        {
          timeout: 60000, // 60 second timeout for local LLM
          responseType: onChunk ? 'stream' : 'json'
        }
      );

      if (onChunk) {
        // Streaming mode
        return new Promise((resolve, reject) => {
          let fullResponse = '';
          
          response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  fullResponse += data.message.content;
                  onChunk(data.message.content);
                }
                if (data.done) {
                  // Return raw response without modification
                  resolve(fullResponse);
                }
              } catch (e) {
                console.error('Error parsing Ollama stream:', e);
              }
            }
          });

          response.data.on('error', (error) => {
            reject(new Error('Ollama streaming error: ' + error.message));
          });

          response.data.on('end', () => {
            if (fullResponse) {
              resolve(fullResponse);
            }
          });
        });
      } else {
        // Non-streaming mode - return raw response
        return response.data.message.content;
      }
    } catch (error) {
      console.error('Ollama API error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama. Make sure Ollama is running at ' + this.ollamaUrl);
      }
      
      throw new Error('Failed to get response from Ollama: ' + error.message);
    }
  }

  /**
   * Parse product references from AI response
   * Format: p{number} where number is the position in product list
   * Example: "The p{1} is perfect!" -> extract [1]
   */
  parseProductReferences(aiResponse) {
    const refRegex = /p\{(\d+)\}/g;
    const references = [];
    let match;

    while ((match = refRegex.exec(aiResponse)) !== null) {
      const index = parseInt(match[1]);
      if (!references.includes(index)) {
        references.push(index);
      }
    }

    return references;
  }

  /**
   * Parse product suggestions from AI response (legacy format)
   * Format: [PRODUCT:id:name:image:price]
   */
  parseProducts(aiResponse) {
    const productRegex = /\[PRODUCT:([^:]+):([^:]+):([^:]+):([^\]]+)\]/g;
    const products = [];
    let match;

    while ((match = productRegex.exec(aiResponse)) !== null) {
      products.push({
        productId: match[1],
        name: match[2],
        image: match[3],
        price: parseFloat(match[4])
      });
    }

    return products;
  }

  /**
   * Remove product tags from response for clean display
   */
  cleanResponse(aiResponse) {
    // Only remove <think> tags - keep everything else
    let cleaned = aiResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return cleaned;
  }
  
  /**
   * Remove DeepSeek thinking tags from response
   */
  removeThinkingTags(response) {
    // Only remove <think> tags
    return response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
}

export default new AIService();
