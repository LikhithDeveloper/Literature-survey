const fetch = require('node-fetch');
const logger = require('../config/logger');

// 🔑 API KEY & MODEL POOL
const API_KEYS = [
  // api keys here
];

// Combine keys with user's specific models
// We cycle through these models using the keys in round-robin
const CONFIG_POOL = [
  { key: API_KEYS[0], model: 'meta-llama/llama-4-maverick-17b-128e-instruct' },
  { key: API_KEYS[1], model: 'llama-3.3-70b-versatile' },
  { key: API_KEYS[2], model: 'qwen/qwen3-32b' },
  { key: API_KEYS[3], model: 'moonshotai/kimi-k2-instruct-0905' },
  { key: API_KEYS[4], model: 'openai/gpt-oss-120b' },
  { key: API_KEYS[0], model: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  { key: API_KEYS[1], model: 'groq/compound' },
  { key: API_KEYS[2], model: 'moonshotai/kimi-k2-instruct' },
  { key: API_KEYS[3], model: 'openai/gpt-oss-20b' },
  { key: API_KEYS[4], model: 'allam-2-7b' },
  { key: API_KEYS[0], model: 'groq/compound-mini' },
  { key: API_KEYS[1], model: 'openai/gpt-oss-safeguard-20b' }
];

let currentIndex = 0;

// Helper to get the next configuration
const getNextConfig = () => {
  const config = CONFIG_POOL[currentIndex];
  currentIndex = (currentIndex + 1) % CONFIG_POOL.length;
  return config;
};

// Base configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1';

// Generate completion using Groq with ROTATING KEYS & MODELS
exports.generateCompletion = async (messages, options = {}) => {
  const maxRetries = 3; 

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get next key/model pair
      const config = getNextConfig();
      const currentKey = config.key;
      // Use the rotating model UNLESS a specific model was strictly requested in options
      // (But we default to the rotating one for general survey generation)
      const currentModel = options.model || config.model;

      logger.info(`[Groq] Using Key #${currentIndex} with Model: ${currentModel}`);
      
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentKey}`
        },
        body: JSON.stringify({
          messages: messages,
          model: currentModel,
          temperature: options.temperature !== undefined ? options.temperature : 0.5,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
          logger.warn(`[Groq] Rate limit hit on ${currentModel}. Retrying with next config...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); 
          continue; 
        }
        
        // Handle model not found (decommissioned) by trying next config
        if (response.status === 400 || response.status === 404) {
           logger.warn(`[Groq] Model error (${currentModel}). Retrying with next config...`);
           continue; 
        }

        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Groq API');
      }

      return data.choices[0].message.content;

    } catch (error) {
       const errorMessage = error?.message || String(error);
       if (attempt === maxRetries - 1) {
         logger.error(`Groq request failed final attempt: ${errorMessage}`);
         throw error || new Error('Unknown error occurred');
       }
       logger.warn(`Groq request failed, retrying: ${errorMessage}`);
    }
  }

  // All retries failed (should be caught by the throw above, but just in case)
  throw new Error(`Groq API failed after ${maxRetries} attempts.`);
};

// Stream completion (for real-time responses)
// Note: Streaming also uses key/model rotation logic if used frequently
exports.streamCompletion = async (messages, options, onData, onEnd, onError) => {
  try {
    const currentKey = API_KEYS[currentKeyIndex];
    
    // Rotate for next time
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentKey}`
      },
      body: JSON.stringify({
        messages: messages,
        model: options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 4000,
        stream: true
      })
    });

    if (!response.status === 200) {
      const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    // Node-fetch stream handling
    const stream = response.body;
    stream.on('data', (chunk) => {
        // Process chunk (implementation simplified for this example)
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            if (line.includes('[DONE]')) return;
            if (line.startsWith('data: ')) {
                try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                    onData(data.choices[0].delta.content);
                }
                } catch (e) {
                // Ignore parse errors for partial chunks
                }
            }
        }
    });

    stream.on('end', () => {
        if (onEnd) onEnd();
    });

    stream.on('error', (err) => {
        if (onError) onError(err);
    });

  } catch (error) {
    logger.error(`Error streaming completion: ${error.message}`);
    if (onError) onError(error);
  }
};

// Generate embeddings (Fallback hashing since Groq doesn't support embeddings yet)
exports.generateEmbedding = async (text) => {
  return exports.generateEmbeddings([text]).then(res => res[0]);
};

exports.generateEmbeddings = async (texts) => {
    logger.warn('Using fallback embedding generation (Groq does not support embeddings yet)');
    
    // Deterministic simulation based on text hash
    return texts.map(text => {
        // Simple hash function to generate deterministic pseudo-random vector
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        
        // Generate a valid 1536-dimensional vector (standard size)
        return Array.from({ length: 1536 }, (_, i) => {
            const val = Math.sin(hash * (i + 1));
            return val;
        });
    });
};
