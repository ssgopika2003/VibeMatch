// Quick test to verify AI configuration
import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 Testing AI Configuration\n');
console.log('Environment Variables:');
console.log('  AI:', process.env.AI);
console.log('  AI_API_KEY:', process.env.AI_API_KEY);
console.log('  AI_OLLAMA:', process.env.AI_OLLAMA);

console.log('\n📊 Evaluation:');

const aiEnabled = process.env.AI === 'enable';
console.log('  AI Enabled:', aiEnabled);

const rawApiKey = process.env.AI_API_KEY;
const apiKey = (rawApiKey && rawApiKey !== 'disable' && rawApiKey.trim() !== '') 
  ? rawApiKey.trim() 
  : null;
console.log('  Has API Key:', !!apiKey);

const rawOllamaUrl = process.env.AI_OLLAMA;
const ollamaUrl = (rawOllamaUrl && rawOllamaUrl !== 'disable' && rawOllamaUrl.trim() !== '') 
  ? rawOllamaUrl.trim() 
  : null;
console.log('  Has Ollama URL:', !!ollamaUrl);
console.log('  Ollama URL:', ollamaUrl);

let provider;
if (apiKey) {
  provider = apiKey.startsWith('AIza') ? 'gemini' : 'openai';
} else if (ollamaUrl) {
  provider = 'ollama';
} else {
  provider = null;
}
console.log('  Provider:', provider);

const finalEnabled = aiEnabled && (apiKey || ollamaUrl);
console.log('\n✅ Final Status:');
console.log('  AI Service Enabled:', finalEnabled);
console.log('  Active Provider:', provider || 'none');

if (!finalEnabled) {
  console.log('\n⚠️  AI is NOT enabled!');
  if (!aiEnabled) console.log('   - AI is not set to "enable" in .env');
  if (!apiKey && !ollamaUrl) console.log('   - No API key or Ollama URL configured');
} else {
  console.log('\n🎉 AI is ready to use with provider:', provider);
}

console.log('');
