/**
 * Sentiment analysis: LSTM inference service with lexicon fallback.
 */

const ML_SERVICE_URL = (() => {
  const raw = (process.env.ML_SERVICE_URL || 'http://localhost:5001').replace(/\/$/, '');
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
})();
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 10000);

const POSITIVE_WORDS = [
  'excellent', 'amazing', 'great', 'good', 'wonderful', 'fantastic', 'outstanding',
  'perfect', 'love', 'best', 'awesome', 'brilliant', 'superb', 'exceptional',
  'satisfied', 'happy', 'pleased', 'impressed', 'recommend', 'helpful', 'friendly',
  'professional', 'quick', 'fast', 'efficient', 'clean', 'modern', 'reliable',
  'honest', 'fair', 'reasonable', 'affordable', 'quality', 'service', 'experience',
];

const NEGATIVE_WORDS = [
  'terrible', 'awful', 'bad', 'horrible', 'worst', 'hate', 'disappointed', 'angry',
  'frustrated', 'slow', 'rude', 'unprofessional', 'dirty', 'expensive', 'overpriced',
  'cheat', 'scam', 'fraud', 'liar', 'dishonest', 'unfair', 'poor', 'broken',
  'damaged', 'defective', 'useless', 'waste', 'regret', 'avoid', 'never',
];

function analyzeSentimentLexicon(text) {
  const textLower = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of POSITIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) positiveScore += matches.length;
  }

  for (const word of NEGATIVE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) negativeScore += matches.length;
  }

  const totalWords = positiveScore + negativeScore;
  if (totalWords === 0) {
    return { sentiment: 0.5, label: 0, source: 'lexicon' };
  }

  const sentiment = positiveScore / totalWords;
  const label = sentiment > 0.5 ? 1 : 0;
  return { sentiment, label, source: 'lexicon' };
}

async function analyzeSentimentLSTM(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const body = await response.json();
    if (!body.success || !body.data) {
      throw new Error(body.error || 'Invalid ML response');
    }

    return {
      sentiment: body.data.sentiment,
      label: body.data.label,
      source: body.data.source || 'lstm',
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @param {string} text
 * @returns {Promise<{ sentiment: number, label: number, source: string }>}
 */
async function analyzeSentiment(text) {
  if (!text || !String(text).trim()) {
    return { sentiment: 0.5, label: 0, source: 'empty' };
  }

  try {
    return await analyzeSentimentLSTM(String(text));
  } catch (err) {
    console.warn('LSTM inference unavailable, using lexicon fallback:', err.message);
    return analyzeSentimentLexicon(String(text));
  }
}

module.exports = {
  analyzeSentiment,
  analyzeSentimentLexicon,
};
