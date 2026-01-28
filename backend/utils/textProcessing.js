const logger = require('../config/logger');

// Chunk text into smaller segments
exports.chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push({
        text: chunk.trim(),
        start: start,
        end: end
      });
    }

    // Move start position with overlap
    start = end - overlap;
    
    // Prevent infinite loop
    if (start >= text.length - overlap) {
      break;
    }
  }

  return chunks;
};

// Clean text (remove extra whitespace, special characters, etc.)
exports.cleanText = (text) => {
  if (!text) return '';

  return text
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove special characters but keep punctuation
    .replace(/[^\w\s.,!?;:()\-'"]/g, '')
    // Remove multiple newlines
    .replace(/\n+/g, '\n')
    // Trim
    .trim();
};

// Extract metadata from text
exports.extractMetadata = (text) => {
  const metadata = {
    wordCount: 0,
    characterCount: 0,
    sentenceCount: 0,
    paragraphCount: 0
  };

  if (!text) return metadata;

  metadata.characterCount = text.length;
  metadata.wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  metadata.sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
  metadata.paragraphCount = text.split(/\n\n+/).filter(para => para.trim().length > 0).length;

  return metadata;
};

// Calculate similarity between two texts (simple Jaccard similarity)
exports.calculateSimilarity = (text1, text2) => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return (intersection.size / union.size) * 100;
};

// Find longest common substring
exports.findLongestCommonSubstring = (text1, text2) => {
  const m = text1.length;
  const n = text2.length;
  let maxLength = 0;
  let endIndex = 0;

  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLength) {
          maxLength = dp[i][j];
          endIndex = i;
        }
      }
    }
  }

  return text1.substring(endIndex - maxLength, endIndex);
};

// Format citation in APA style
exports.formatAPACitation = (paper) => {
  const { authors, year, title, journal, volume, issue, pages, doi, url } = paper;

  let citation = '';

  // Authors
  if (authors && authors.length > 0) {
    if (authors.length === 1) {
      citation += `${authors[0]}`;
    } else if (authors.length === 2) {
      citation += `${authors[0]}, & ${authors[1]}`;
    } else {
      citation += `${authors[0]}, et al.`;
    }
  }

  // Year
  citation += ` (${year || 'n.d.'}).`;

  // Title
  citation += ` ${title}.`;

  // Journal
  if (journal) {
    citation += ` ${journal}`;
    if (volume) {
      citation += `, ${volume}`;
      if (issue) {
        citation += `(${issue})`;
      }
    }
    if (pages) {
      citation += `, ${pages}`;
    }
    citation += '.';
  }

  // DOI or URL
  if (doi) {
    citation += ` https://doi.org/${doi}`;
  } else if (url) {
    citation += ` ${url}`;
  }

  return citation;
};

// Generate unique ID
exports.generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Validate email
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
exports.isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Estimate reading time (words per minute)
exports.estimateReadingTime = (text, wpm = 200) => {
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wpm);
  return minutes;
};

module.exports = exports;
