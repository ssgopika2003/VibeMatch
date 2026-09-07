import express from 'express';
import ChatMessage from '../models/ChatMessage.model.js';
import Product from '../models/Product.model.js';
import { auth } from '../middleware/auth.middleware.js';
import aiService from '../services/ai.service.js';

const router = express.Router();

// Check if AI is enabled
router.get('/status', auth(), async (req, res) => {
  try {
    const isEnabled = aiService.isEnabled();
    const provider = aiService.getProvider();
    
    console.log('🤖 Chat Status Request:', {
      enabled: isEnabled,
      provider: provider || 'none',
      user: req.user.email
    });
    
    res.json({
      success: true,
      enabled: isEnabled,
      provider: provider || 'none'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking AI status',
      error: error.message
    });
  }
});

// Get chat history
router.get('/history', auth(), async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    // Reverse to get chronological order
    const chronological = messages.reverse();
    
    res.json({
      success: true,
      messages: chronological
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
});

// Send message to AI (with streaming support for Ollama)
router.post('/message', auth(), async (req, res) => {
  try {
    const { message, mode, products } = req.body;

    console.log('🤖 Chatbot Payload Received:', {
      userId: req.user?.id,
      mode,
      message,
      productsCount: Array.isArray(products) ? products.length : 0,
      products
    });
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'AI chatbot is not available. Please check server configuration.'
      });
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      userId: req.user.id,
      role: 'user',
      content: message.trim()
    });

    // Get full chat history for context (small app, no hard limit)
    const recentMessages = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('role content');
    
    // Build conversation context (reverse to chronological order)
    let conversationHistory = recentMessages
      .reverse()
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Inject product context whenever products are provided
    let productMap = [];
    if (products && products.length > 0) {
      // Fetch full product details from DB to get category, subcategory, silhouette, gender info
      const productIds = products.map(p => p._id || p.id).filter(Boolean);
      let fullProducts = [];
      if (productIds.length > 0) {
        try {
          fullProducts = await Product.find({ _id: { $in: productIds } })
            .select('name category subcategory silhouette description vibeTags gender searchKeywords price discountPrice images')
            .lean();
        } catch (err) {
          console.error('Error fetching full product details:', err);
        }
      }

      // Build a lookup map from DB results
      const fullProductMap = {};
      for (const fp of fullProducts) {
        fullProductMap[fp._id.toString()] = fp;
      }

      // Number the products (1-indexed) with enriched data
      productMap = products.map((p, index) => {
        const pid = (p._id || p.id || '').toString();
        const fullP = fullProductMap[pid] || {};

        // Extract image URL - handle both formats: string or object with url property
        let imageUrl = null;
        if (p.images && p.images.length > 0) {
          const firstImage = p.images[0];
          imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
        } else if (p.image) {
          imageUrl = typeof p.image === 'string' ? p.image : p.image?.url;
        }

        return {
          number: index + 1,
          productId: pid,
          name: p.name,
          price: p.discountPrice || p.price,
          image: imageUrl,
          category: fullP.category || '',
          subcategory: fullP.subcategory || '',
          silhouette: fullP.silhouette || '',
          gender: fullP.gender || '',
          vibeTags: fullP.vibeTags || [],
          description: (fullP.description || '').substring(0, 80) // brief description
        };
      });

      // Create numbered product list for AI with category/gender context
      const numberedProducts = productMap
        .map(p => {
          let details = `${p.number}. ${p.name} - ₹${p.price} [Category: ${p.category || 'N/A'}`;
          if (p.subcategory) details += `, Sub: ${p.subcategory}`;
          if (p.silhouette) details += `, Silhouette: ${p.silhouette}`;
          if (p.gender) details += `, Gender: ${p.gender}`;
          if (p.vibeTags && p.vibeTags.length > 0) details += `, Vibes: ${p.vibeTags.join('/')}`;
          if (p.description) details += `, Desc: ${p.description}`;
          details += ']';
          return details;
        })
        .join('\n');

      // Inject context at the end of the user's message
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        lastMessage.content = `Products available (use p{number} format ONLY):
${numberedProducts}

IMPORTANT: 
- Reference products ONLY as p{1}, p{2}, p{3}, etc. DO NOT use product names!
- ONLY suggest products that match what the customer is asking for.
- Use the Category, Subcategory, Silhouette, and Gender fields to filter relevant products.
- If the customer asks for "t-shirt" or "oversized", do NOT suggest Ornaments or Cosmetics.
- If the customer asks for "men" or "guys", only suggest products with Gender: Men or unisex.
- If no products match, honestly tell the customer.

Customer question: ${lastMessage.content}`;
      }
    }

    const provider = aiService.getProvider();
    
    // For Ollama (streaming), use SSE
    if (provider === 'ollama' && req.headers.accept === 'text/event-stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';
      
      try {
        const response = await aiService.chat(conversationHistory, (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        // Remove <think> tags only
        const cleanedResponse = aiService.removeThinkingTags(response);

        // Parse product references (p{1}, p{2}, etc.)
        const productRefs = aiService.parseProductReferences(cleanedResponse);
        
        // Map product references to actual product data
        const referencedProducts = productRefs
          .map(num => productMap.find(p => p.number === num))
          .filter(Boolean);

        // Save assistant message with cleaned response
        await ChatMessage.create({
          userId: req.user.id,
          role: 'assistant',
          content: cleanedResponse,
          metadata: {
            productRefs,
            products: referencedProducts,
            provider
          }
        });

        // Send final message with product mapping
        res.write(`data: ${JSON.stringify({ 
          done: true, 
          fullResponse: cleanedResponse,
          productRefs,
          products: referencedProducts
        })}\n\n`);
        res.end();
        
      } catch (error) {
        console.error('Chat error:', error);
        res.write(`data: ${JSON.stringify({ 
          error: true, 
          message: error.message 
        })}\n\n`);
        res.end();
      }
    } else {
      // Standard JSON response (OpenAI or non-streaming)
      try {
        const response = await aiService.chat(conversationHistory);
        
        // Remove <think> tags only
        const cleanedResponse = aiService.removeThinkingTags(response);

        // Parse product references (p{1}, p{2}, etc.)
        const productRefs = aiService.parseProductReferences(cleanedResponse);
        
        // Map product references to actual product data
        const referencedProducts = productRefs
          .map(num => productMap.find(p => p.number === num))
          .filter(Boolean);

        // Save assistant message with cleaned response
        await ChatMessage.create({
          userId: req.user.id,
          role: 'assistant',
          content: cleanedResponse,
          metadata: {
            productRefs,
            products: referencedProducts,
            provider
          }
        });

        res.json({
          success: true,
          message: cleanedResponse,
          productRefs,
          products: referencedProducts,
          provider
        });
        
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get AI response: ' + error.message
        });
      }
    }
    
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat message',
      error: error.message
    });
  }
});

// Clear chat history
router.delete('/history', auth(), async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
      error: error.message
    });
  }
});

export default router;
