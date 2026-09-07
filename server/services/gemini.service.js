import axios from 'axios';

class GeminiService {
  constructor() {
    this._apiKey = null;
    this._initialized = false;
    this._modelCandidatesCache = null;
  }

  _init() {
    if (this._initialized) return;
    this._apiKey = process.env.GEMINI_API_KEY || null;
    this._initialized = true;
    console.log(
      '💎 Gemini Service:',
      this._apiKey ? `API key found (${this._apiKey.slice(0, 8)}...)` : 'No API key – AI features disabled'
    );
  }

  isEnabled() {
    this._init();
    return !!this._apiKey;
  }

  /**
   * Internal: call Gemini expecting a JSON response.
   * Returns parsed object or null on any error.
   */
  async _callGemini(prompt) {
    this._init();
    if (!this._apiKey) return null;

    const modelCandidates = await this._getModelCandidates();
    let lastError = null;

    for (const model of modelCandidates) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this._apiKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text)
          .filter(Boolean)
          .join('\n')
          ?.trim();
        if (!text) {
          lastError = new Error(`Gemini response empty for model: ${model}`);
          continue;
        }

        const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        return JSON.parse(clean);
      } catch (error) {
        if (this._isQuotaError(error)) {
          throw new Error(this._getQuotaMessage(error));
        }

        if (!this._isModelError(error)) {
          throw error;
        }

        lastError = error;
      }
    }

    throw lastError || new Error('No supported Gemini model produced a valid response');
  }

  async _getModelCandidates() {
    if (this._modelCandidatesCache) {
      return this._modelCandidatesCache;
    }

    const configuredModel = process.env.GEMINI_MODEL || process.env.AI_GEMINI_MODEL;
    const preferredOrder = [
      configuredModel,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter(Boolean);

    try {
      const response = await axios.get(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this._apiKey}`,
        { timeout: 10000 }
      );

      const supportedModels = (response.data?.models || [])
        .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
        .map((model) => (model.name || '').replace(/^models\//, ''))
        .filter(Boolean);

      this._modelCandidatesCache = [...preferredOrder, ...supportedModels].filter(
        (model, index, arr) => arr.indexOf(model) === index
      );

      console.log('💎 Gemini Service supported models:', this._modelCandidatesCache);
      return this._modelCandidatesCache;
    } catch (error) {
      if (this._isQuotaError(error)) {
        throw new Error(this._getQuotaMessage(error));
      }

      console.warn(
        '💎 Gemini Service model discovery failed, using fallback list:',
        error.response?.data || error.message
      );
      this._modelCandidatesCache = preferredOrder;
      return this._modelCandidatesCache;
    }
  }

  _isQuotaError(error) {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase();
    return status === 429 || message.includes('quota') || message.includes('rate limit') || message.includes('resource exhausted');
  }

  _isModelError(error) {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase();
    return status === 404 || message.includes('not found for api version') || message.includes('not supported for generatecontent');
  }

  _getQuotaMessage(error) {
    const apiMessage = error?.response?.data?.error?.message || error?.message || 'Unknown Gemini quota error';
    return `Gemini quota or rate limit reached. ${apiMessage}`;
  }

  /**
   * Generate a personal message and per-product AI reason for the "For You" page.
   *
   * @param {Object} userProfile  - { gender, skinTone, bodyType, age, dressSize, ageGroup }
   * @param {Array}  products     - condensed product list
   * @returns {Object|null}       - { personalMessage: string, reasons: { [productId]: string } }
   */
  async generateForYouInsights(userProfile, products) {
    try {
      const productLines = products
        .map((p) => {
          const parts = [`[ID: ${p._id}] "${p.name}"`, `Category: ${p.category}`];
          if (p.subcategory) parts.push(`Subcategory: ${p.subcategory}`);
          if (p.silhouette) parts.push(`Silhouette: ${p.silhouette}`);
          if (p.colors?.length)
            parts.push(`Colors: ${p.colors.map((c) => c.name || c).join(', ')}`);
          if (p.undertoneCompatibility?.length)
            parts.push(`Works for: ${p.undertoneCompatibility.join('/')} undertones`);
          if (p.vibeTags?.length) parts.push(`Vibes: ${p.vibeTags.join(', ')}`);
          return parts.join(' | ');
        })
        .join('\n');

      const prompt = `You are a warm, inclusive fashion stylist AI for VibeMatch, a fashion store.

Customer profile:
- Gender: ${userProfile.gender || 'Not specified'}
- Skin Tone: ${userProfile.skinTone || 'Not specified'}
- Body Type: ${userProfile.bodyType || 'Not specified'}
- Age: ${userProfile.age || 'Not specified'} (${userProfile.ageGroup || 'All Ages'})
- Dress Size: ${userProfile.dressSize || 'Not specified'}

Products available for this customer:
${productLines}

Tasks:
1. Write a warm, personalised 2-sentence greeting for this customer. Naturally mention their skin tone, body type, or vibes to show it's truly personal.
2. For EACH product write a very short reason (max 8 words) explaining WHY it suits this customer specifically.
   - Cosmetics (Lipstick, Blush, etc.): focus on skin tone / undertone match.
   - Dresses: focus on silhouette / size / color compatibility.
   - Ornaments: focus on style / vibe match.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "personalMessage": "...",
  "reasons": {
    "<productId1>": "<short reason>",
    "<productId2>": "<short reason>"
  }
}`;

      return await this._callGemini(prompt);
    } catch (err) {
      console.error('Gemini generateForYouInsights error:', err.message);
      return null;
    }
  }

  /**
   * Find similar / matching products for a given anchor product.
   *
   * @param {Object} anchor      - condensed anchor product
   * @param {Array}  candidates  - condensed candidate list
   * @returns {Array}            - [{ productId, matchReason }] max 6, sorted by relevance
   */
  async findSimilarProducts(anchor, candidates) {
    try {
      const candidateLines = candidates
        .map((p) => {
          const parts = [`[ID: ${p._id}] "${p.name}"`, `${p.category}`];
          if (p.subcategory) parts.push(p.subcategory);
          if (p.colors?.length) parts.push(`Colors: ${p.colors.map((c) => c.name || c).join(', ')}`);
          if (p.vibeTags?.length) parts.push(`Vibes: ${p.vibeTags.join(', ')}`);
          if (p.silhouette) parts.push(`Silhouette: ${p.silhouette}`);
          return parts.join(' | ');
        })
        .join('\n');

      const anchorDesc = [
        `Name: "${anchor.name}"`,
        `Category: ${anchor.category}`,
        anchor.subcategory ? `Subcategory: ${anchor.subcategory}` : null,
        anchor.colors?.length ? `Colors: ${anchor.colors.map((c) => c.name || c).join(', ')}` : null,
        anchor.vibeTags?.length ? `Vibes: ${anchor.vibeTags.join(', ')}` : null,
        anchor.silhouette ? `Silhouette: ${anchor.silhouette}` : null,
        anchor.undertoneCompatibility?.length
          ? `Undertone: ${anchor.undertoneCompatibility.join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const prompt = `You are a fashion recommendation AI for VibeMatch store.

A customer is viewing:
${anchorDesc}

Candidate products from our store:
${candidateLines}

Pick the TOP 6 most relevant candidates that a customer viewing "${anchor.name}" would also want to buy.
Consider: similar style, matching / complementary colors, same vibe, compatible silhouette, or items that pair well together.

For each pick give a short match reason (max 7 words) explaining the connection.
Examples: "Same floral summer palette", "Pairs with this silhouette", "Matching warm jewel tones", "Similar boho aesthetic".

Return ONLY valid JSON (no markdown):
{
  "similar": [
    { "productId": "<id>", "matchReason": "<reason>" }
  ]
}`;

      const result = await this._callGemini(prompt);
      return result?.similar || [];
    } catch (err) {
      console.error('Gemini findSimilarProducts error:', err.message);
      return [];
    }
  }

  /**
   * Personalized product suggestions for a specific user and selected product.
   *
   * @param {Object} userProfile
   * @param {Object} selectedProduct
   * @param {Array} allProducts - condensed active product list (excluding selected)
   * @returns {Array} [{ productId, matchReason }]
   */
  async generatePersonalizedSuggestions(userProfile, selectedProduct, allProducts) {
    try {
      const profileText = [
        `Gender: ${userProfile?.gender || 'Not specified'}`,
        `Age: ${userProfile?.age || 'Not specified'} (${userProfile?.ageGroup || 'All Ages'})`,
        `Body Type: ${userProfile?.bodyType || 'Not specified'}`,
        `Skin Tone: ${userProfile?.skinTone || 'Not specified'}`,
        `Dress Size: ${userProfile?.dressSize || 'Not specified'}`,
        `Undertone: ${userProfile?.undertone || 'Not specified'}`,
        `Favorite Vibes: ${userProfile?.favoriteVibes?.join(', ') || 'Not specified'}`,
      ].join('\n');

      const selectedText = [
        `[Selected Product ID: ${selectedProduct?._id}] ${selectedProduct?.name}`,
        `Category: ${selectedProduct?.category || ''}`,
        `Subcategory: ${selectedProduct?.subcategory || ''}`,
        `Description: ${selectedProduct?.description || ''}`,
        `Price: ${selectedProduct?.price || ''}`,
        `Vibes: ${selectedProduct?.vibeTags?.join(', ') || ''}`,
        `Undertone: ${selectedProduct?.undertoneCompatibility?.join(', ') || ''}`,
        `Colors: ${selectedProduct?.colors?.map((c) => c.name || c).join(', ') || ''}`,
        `Silhouette: ${selectedProduct?.silhouette || ''}`,
      ].join('\n');

      const allProductText = allProducts
        .map((p) => {
          const parts = [
            `[ID: ${p._id}] ${p.name}`,
            `Category: ${p.category}`,
            `Subcategory: ${p.subcategory || ''}`,
            `Description: ${p.description || ''}`,
            `Price: ${p.price || ''}`,
            `DiscountPrice: ${p.discountPrice || ''}`,
            `Vibes: ${p.vibeTags?.join(', ') || ''}`,
            `Undertone: ${p.undertoneCompatibility?.join(', ') || ''}`,
            `Colors: ${p.colors?.map((c) => c.name || c).join(', ') || ''}`,
            `Silhouette: ${p.silhouette || ''}`,
            `Recommended Gender: ${p.recommendedFor?.gender?.join(', ') || ''}`,
            `Recommended BodyType: ${p.recommendedFor?.bodyType?.join(', ') || ''}`,
            `Recommended SkinTone: ${p.recommendedFor?.skinTone?.join(', ') || ''}`,
          ];
          return parts.join(' | ');
        })
        .join('\n');

      const prompt = `You are a fashion recommendation AI for VibeMatch.

USER PROFILE:
${profileText}

CURRENTLY SELECTED PRODUCT:
${selectedText}

ALL AVAILABLE STORE PRODUCTS:
${allProductText}

TASK:
1) Pick top 8 products from ALL AVAILABLE STORE PRODUCTS that best fit this user.
2) Consider BOTH: (a) user profile fit and (b) compatibility with selected product.
3) Prefer balanced category suggestions across Dress, Cosmetic, Ornament when possible.
4) Do not include selected product itself.
5) Give short reason (max 8 words) for each selected product.

Return ONLY valid JSON:
{
  "recommended": [
    { "productId": "<id>", "matchReason": "<reason>" }
  ]
}`;

      const result = await this._callGemini(prompt);
      return result?.recommended || [];
    } catch (err) {
      console.error('Gemini generatePersonalizedSuggestions error:', err.message);
      return [];
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
