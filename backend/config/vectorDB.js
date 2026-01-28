const logger = require('./logger');

class VectorDBClient {
  constructor() {
    this.client = null;
    this.collection = null;
    this.isAvailable = false;
  }

  async initialize() {
    try {
      // ChromaDB is optional - if not available, operations will be skipped
      const { ChromaClient } = require('chromadb');
      
      this.client = new ChromaClient({
        path: process.env.CHROMA_HOST || 'http://localhost:8000'
      });

      // Test connection
      await this.client.heartbeat();
      this.isAvailable = true;
      
      logger.info('ChromaDB client initialized successfully');
      return this.client;
    } catch (error) {
      this.isAvailable = false;
      logger.warn(`ChromaDB not available: ${error.message}. Vector operations will be skipped.`);
      return null;
    }
  }

  async getOrCreateCollection(name) {
    try {
      if (!this.isAvailable && !this.client) {
        await this.initialize();
      }

      if (!this.isAvailable) {
        logger.warn('ChromaDB not available, skipping collection operation');
        return null;
      }

      this.collection = await this.client.getOrCreateCollection({
        name: name,
        metadata: { description: 'Literature survey documents and papers' }
      });

      logger.info(`Collection '${name}' ready`);
      return this.collection;
    } catch (error) {
      logger.warn(`ChromaDB collection operation skipped: ${error.message}`);
      return null;
    }
  }

  async addDocuments(collectionName, documents, embeddings, metadatas, ids) {
    try {
      if (!this.isAvailable) {
        logger.warn('ChromaDB not available, skipping add documents');
        return false;
      }

      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) return false;

      await collection.add({
        ids: ids,
        embeddings: embeddings,
        metadatas: metadatas,
        documents: documents
      });

      logger.info(`Added ${documents.length} documents to collection '${collectionName}'`);
      return true;
    } catch (error) {
      logger.warn(`ChromaDB add documents skipped: ${error.message}`);
      return false;
    }
  }

  async query(collectionName, queryEmbeddings, nResults = 10, filter = null) {
    try {
      if (!this.isAvailable) {
        logger.warn('ChromaDB not available, skipping query');
        return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] };
      }

      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) {
        return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] };
      }

      const results = await collection.query({
        queryEmbeddings: queryEmbeddings,
        nResults: nResults,
        where: filter
      });

      logger.info(`Query returned ${results.ids[0].length} results from '${collectionName}'`);
      return results;
    } catch (error) {
      logger.warn(`ChromaDB query skipped: ${error.message}`);
      return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] };
    }
  }

  async deleteCollection(collectionName) {
    try {
      if (!this.isAvailable) {
        logger.warn('ChromaDB not available, skipping delete collection');
        return false;
      }

      if (!this.client) {
        await this.initialize();
      }

      if (!this.isAvailable) return false;

      await this.client.deleteCollection({ name: collectionName });
      logger.info(`Collection '${collectionName}' deleted`);
      return true;
    } catch (error) {
      logger.warn(`ChromaDB delete collection skipped: ${error.message}`);
      return false;
    }
  }

  async updateDocuments(collectionName, ids, embeddings, metadatas, documents) {
    try {
      if (!this.isAvailable) {
        logger.warn('ChromaDB not available, skipping update documents');
        return false;
      }

      const collection = await this.getOrCreateCollection(collectionName);
      if (!collection) return false;

      await collection.update({
        ids: ids,
        embeddings: embeddings,
        metadatas: metadatas,
        documents: documents
      });

      logger.info(`Updated ${ids.length} documents in collection '${collectionName}'`);
      return true;
    } catch (error) {
      logger.warn(`ChromaDB update documents skipped: ${error.message}`);
      return false;
    }
  }
}

// Export singleton instance
const vectorDBClient = new VectorDBClient();

module.exports = vectorDBClient;
