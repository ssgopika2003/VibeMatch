import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    products: [{
      productId: mongoose.Schema.Types.ObjectId,
      name: String,
      image: String,
      price: Number
    }],
    wasFiltered: Boolean, // Track if off-topic question was filtered
    provider: String // 'openai' or 'ollama'
  }
}, {
  timestamps: true
});

// Index for efficient chat history retrieval
chatMessageSchema.index({ userId: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
