const axios = require('axios');
const { chunkText, cleanText } = require('../utils/textProcessing');
const { generateEmbeddings } = require('../utils/groq');
const vectorDBClient = require('../config/vectorDB');
const logger = require('../config/logger');

class PaperRetrievalAgent {
  constructor(surveyId, topic, additionalInfo = '') {
    this.surveyId = surveyId;
    this.topic = topic;
    this.additionalInfo = additionalInfo;
    this.collectionName = `survey_${surveyId}`;
    this.retrievedPapers = [];
  }

  // Main execution method
  async execute(progressCallback) {
    try {
      logger.info(`[Agent 2] Starting Paper Retrieval for survey: ${this.surveyId}`);
      
      const papers = [];

      // Search ArXiv
      if (progressCallback) {
        progressCallback({
          agent: 'paper_retrieval',
          progress: 10,
          message: 'Searching ArXiv for relevant papers...'
        });
      }
      const arxivPapers = await this.searchArXiv();
      papers.push(...arxivPapers);

      // Search Semantic Scholar
      if (progressCallback) {
        progressCallback({
          agent: 'paper_retrieval',
          progress: 40,
          message: 'Searching Semantic Scholar...'
        });
      }
      const semanticPapers = await this.searchSemanticScholar();
      papers.push(...semanticPapers);

      // Search PubMed (if topic is medical/biological)
      if (progressCallback) {
        progressCallback({
          agent: 'paper_retrieval',
          progress: 60,
          message: 'Searching PubMed...'
        });
      }
      const pubmedPapers = await this.searchPubMed();
      papers.push(...pubmedPapers);

      // Remove duplicates based on title similarity
      const uniquePapers = this.removeDuplicates(papers);
      this.retrievedPapers = uniquePapers;

      logger.info(`[Agent 2] Retrieved ${uniquePapers.length} unique papers`);

      // Process and store papers in vector DB
      if (progressCallback) {
        progressCallback({
          agent: 'paper_retrieval',
          progress: 80,
          message: `Processing ${uniquePapers.length} papers...`
        });
      }

      await this.processPapers(uniquePapers);

      if (progressCallback) {
        progressCallback({
          agent: 'paper_retrieval',
          progress: 100,
          message: `Retrieved and processed ${uniquePapers.length} papers`
        });
      }

      logger.info(`[Agent 2] Completed. Retrieved ${uniquePapers.length} papers`);

      return {
        success: true,
        papersRetrieved: uniquePapers.length,
        papers: uniquePapers
      };
    } catch (error) {
      logger.error(`[Agent 2] Error in Paper Retrieval Agent: ${error.message}`);
      throw error;
    }
  }

  // Search ArXiv
  async searchArXiv() {
    try {
      const query = encodeURIComponent(`${this.topic} ${this.additionalInfo}`.trim());
      const url = `http://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=20&sortBy=relevance&sortOrder=descending`;

      const response = await axios.get(url, { timeout: 30000 });
      const xmlData = response.data;

      // Parse XML (simple regex parsing, could use xml2js for better parsing)
      const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      
      const papers = entries.map(entry => {
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1]?.trim() || '';
        const summary = entry.match(/<summary>(.*?)<\/summary>/)?.[1]?.trim() || '';
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim() || '';
        const authors = entry.match(/<name>(.*?)<\/name>/g)?.map(a => a.replace(/<\/?name>/g, '').trim()) || [];
        const id = entry.match(/<id>(.*?)<\/id>/)?.[1]?.trim() || '';
        const pdfUrl = entry.match(/<link.*?title="pdf".*?href="(.*?)".*?\/>/)?.[1] || '';

        return {
          title: cleanText(title),
          authors: authors,
          year: published ? new Date(published).getFullYear() : null,
          source: 'arxiv',
          url: id,
          pdfUrl: pdfUrl,
          abstract: cleanText(summary),
          doi: null
        };
      });

      logger.info(`[Agent 2] Found ${papers.length} papers from ArXiv`);
      return papers;
    } catch (error) {
      logger.error(`[Agent 2] Error searching ArXiv: ${error.message}`);
      return [];
    }
  }

  // Search Semantic Scholar
  async searchSemanticScholar() {
    try {
      const query = encodeURIComponent(`${this.topic} ${this.additionalInfo}`.trim());
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${query}&limit=20&fields=title,authors,year,abstract,url,externalIds,openAccessPdf`;

      const headers = {};
      if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
        headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
      }

      const response = await axios.get(url, { headers, timeout: 30000 });
      const data = response.data.data || [];

      const papers = data.map(paper => ({
        title: paper.title || '',
        authors: paper.authors?.map(a => a.name) || [],
        year: paper.year || null,
        source: 'semantic_scholar',
        url: paper.url || '',
        pdfUrl: paper.openAccessPdf?.url || '',
        abstract: paper.abstract || '',
        doi: paper.externalIds?.DOI || null
      }));

      logger.info(`[Agent 2] Found ${papers.length} papers from Semantic Scholar`);
      return papers;
    } catch (error) {
      logger.error(`[Agent 2] Error searching Semantic Scholar: ${error.message}`);
      return [];
    }
  }

  // Search PubMed
  async searchPubMed() {
    try {
      const query = encodeURIComponent(`${this.topic} ${this.additionalInfo}`.trim());
      
      // First, search for IDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmax=15&retmode=json`;
      const searchResponse = await axios.get(searchUrl, { timeout: 30000 });
      const ids = searchResponse.data.esearchresult?.idlist || [];

      if (ids.length === 0) {
        return [];
      }

      // Fetch details for each ID
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
      const fetchResponse = await axios.get(fetchUrl, { timeout: 30000 });
      const results = fetchResponse.data.result || {};

      const papers = ids.map(id => {
        const paper = results[id];
        if (!paper) return null;

        return {
          title: paper.title || '',
          authors: paper.authors?.map(a => a.name) || [],
          year: paper.pubdate ? new Date(paper.pubdate).getFullYear() : null,
          source: 'pubmed',
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          pdfUrl: '',
          abstract: '', // PubMed summary doesn't include full abstract in esummary
          doi: paper.elocationid || null
        };
      }).filter(p => p !== null);

      logger.info(`[Agent 2] Found ${papers.length} papers from PubMed`);
      return papers;
    } catch (error) {
      logger.error(`[Agent 2] Error searching PubMed: ${error.message}`);
      return [];
    }
  }

  // Remove duplicate papers based on title similarity
  removeDuplicates(papers) {
    const unique = [];
    const seenTitles = new Set();

    for (const paper of papers) {
      const normalizedTitle = paper.title.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Check if we've seen a very similar title
      let isDuplicate = false;
      for (const seenTitle of seenTitles) {
        const similarity = this.calculateTitleSimilarity(normalizedTitle, seenTitle);
        if (similarity > 0.85) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(paper);
        seenTitles.add(normalizedTitle);
      }
    }

    return unique;
  }

  // Calculate title similarity (simple Jaccard)
  calculateTitleSimilarity(title1, title2) {
    const words1 = new Set(title1.split(/\s+/));
    const words2 = new Set(title2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  // Process papers and store in vector DB
  async processPapers(papers) {
    try {
      const allChunks = [];

      for (const paper of papers) {
        // Use abstract for now (full text would require PDF download)
        const text = `${paper.title}\n\n${paper.abstract}`;
        const cleanedText = cleanText(text);

        // Chunk the text
        const chunks = chunkText(cleanedText, 1000, 200);

        // Add metadata
        const chunksWithMetadata = chunks.map((chunk, index) => ({
          text: chunk.text,
          metadata: {
            source_type: 'paper',
            source_id: paper.url,
            source_title: paper.title,
            authors: paper.authors.join(', '),
            year: paper.year,
            source: paper.source,
            doi: paper.doi,
            chunk_index: index,
            total_chunks: chunks.length,
            survey_id: this.surveyId
          }
        }));

        allChunks.push(...chunksWithMetadata);
      }

      // Store in vector DB
      if (allChunks.length > 0) {
        await this.storeInVectorDB(allChunks);
      }

      return true;
    } catch (error) {
      logger.error(`[Agent 2] Error processing papers: ${error.message}`);
      throw error;
    }
  }

  // Store chunks in vector database
  async storeInVectorDB(chunks) {
    try {
      const batchSize = 100;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
        
        const texts = batch.map(chunk => chunk.text);
        const embeddings = await generateEmbeddings(texts);
        const ids = batch.map((_, index) => `paper_${this.surveyId}_${i + index}`);
        const metadatas = batch.map(chunk => chunk.metadata);
        
        await vectorDBClient.addDocuments(
          this.collectionName,
          texts,
          embeddings,
          metadatas,
          ids
        );
        
        logger.info(`[Agent 2] Stored batch ${Math.floor(i / batchSize) + 1} in vector DB (${batch.length} chunks)`);
      }

      return true;
    } catch (error) {
      logger.error(`[Agent 2] Error storing in vector DB: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PaperRetrievalAgent;
