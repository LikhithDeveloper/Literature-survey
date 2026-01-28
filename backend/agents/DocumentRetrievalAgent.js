const { extractTextFromFile } = require('../utils/fileProcessing');
const { chunkText, cleanText } = require('../utils/textProcessing');
const { generateEmbeddings } = require('../utils/groq');
const vectorDBClient = require('../config/vectorDB');
const logger = require('../config/logger');

class DocumentRetrievalAgent {
  constructor(surveyId, documents) {
    this.surveyId = surveyId;
    this.documents = documents;
    this.collectionName = `survey_${surveyId}`;
  }

  // Main execution method
  async execute(progressCallback) {
    try {
      logger.info(`[Agent 1] Starting Document Retrieval for survey: ${this.surveyId}`);
      
      if (!this.documents || this.documents.length === 0) {
        logger.info(`[Agent 1] No documents uploaded, skipping to next agent`);
        if (progressCallback) {
          progressCallback({
            agent: 'document_retrieval',
            progress: 100,
            message: 'No documents to process, moving to paper retrieval...'
          });
        }
        return {
          success: true,
          documentsProcessed: 0,
          chunks: [],
          message: 'No documents uploaded'
        };
      }

      const totalDocuments = this.documents.length;
      const processedDocuments = [];
      let allChunks = [];

      // Process each document
      for (let i = 0; i < totalDocuments; i++) {
        const doc = this.documents[i];
        
        if (progressCallback) {
          progressCallback({
            agent: 'document_retrieval',
            progress: Math.floor((i / totalDocuments) * 80), // 0-80%
            message: `Processing document ${i + 1}/${totalDocuments}: ${doc.originalName}`
          });
        }

        try {
          // Extract text from document
          const text = await extractTextFromFile(doc.path, doc.mimetype);
          
          // Clean text
          const cleanedText = cleanText(text);

          // Chunk text
          const chunks = chunkText(cleanedText, 1000, 200);

          // Add metadata to chunks
          const chunksWithMetadata = chunks.map((chunk, index) => ({
            text: chunk.text,
            metadata: {
              source_type: 'document',
              source_id: doc.filename,
              source_title: doc.originalName,
              chunk_index: index,
              total_chunks: chunks.length,
              survey_id: this.surveyId
            }
          }));

          allChunks.push(...chunksWithMetadata);

          processedDocuments.push({
            filename: doc.filename,
            originalName: doc.originalName,
            chunksCount: chunks.length,
            textLength: cleanedText.length
          });

          logger.info(`[Agent 1] Processed document: ${doc.originalName} (${chunks.length} chunks)`);
        } catch (error) {
          logger.error(`[Agent 1] Error processing document ${doc.originalName}: ${error.message}`);
          // Continue with other documents
        }
      }

      // Generate embeddings and store in vector DB
      if (allChunks.length > 0) {
        if (progressCallback) {
          progressCallback({
            agent: 'document_retrieval',
            progress: 85,
            message: 'Generating embeddings...'
          });
        }

        await this.storeInVectorDB(allChunks);
      }

      if (progressCallback) {
        progressCallback({
          agent: 'document_retrieval',
          progress: 100,
          message: `Completed processing ${processedDocuments.length} documents`
        });
      }

      logger.info(`[Agent 1] Completed. Processed ${processedDocuments.length} documents with ${allChunks.length} chunks`);

      return {
        success: true,
        documentsProcessed: processedDocuments.length,
        chunks: allChunks.length,
        details: processedDocuments
      };
    } catch (error) {
      logger.error(`[Agent 1] Error in Document Retrieval Agent: ${error.message}`);
      throw error;
    }
  }

  // Store chunks in vector database
  async storeInVectorDB(chunks) {
    try {
      const batchSize = 100; // Process in batches to avoid memory issues
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
        
        // Extract texts for embedding
        const texts = batch.map(chunk => chunk.text);
        
        // Generate embeddings
        const embeddings = await generateEmbeddings(texts);
        
        // Prepare data for vector DB
        const ids = batch.map((_, index) => `doc_${this.surveyId}_${i + index}`);
        const metadatas = batch.map(chunk => chunk.metadata);
        
        // Store in vector DB
        await vectorDBClient.addDocuments(
          this.collectionName,
          texts,
          embeddings,
          metadatas,
          ids
        );
        
        logger.info(`[Agent 1] Stored batch ${Math.floor(i / batchSize) + 1} in vector DB (${batch.length} chunks)`);
      }

      return true;
    } catch (error) {
      logger.error(`[Agent 1] Error storing in vector DB: ${error.message}`);
      throw error;
    }
  }

  // Query vector DB for relevant chunks
  async queryVectorDB(query, nResults = 10) {
    try {
      const { generateEmbedding } = require('../utils/openai');
      const queryEmbedding = await generateEmbedding(query);
      
      const results = await vectorDBClient.query(
        this.collectionName,
        [queryEmbedding],
        nResults,
        { source_type: 'document' }
      );

      return results;
    } catch (error) {
      logger.error(`[Agent 1] Error querying vector DB: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DocumentRetrievalAgent;
