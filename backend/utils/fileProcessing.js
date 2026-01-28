const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const logger = require('../config/logger');

// Extract text from PDF
exports.extractPDFText = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    logger.info(`Extracted ${data.numpages} pages from PDF: ${filePath}`);
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    logger.error(`Error extracting PDF text: ${error.message}`);
    throw new Error(`Failed to extract PDF: ${error.message}`);
  }
};

// Extract text from DOCX
exports.extractDOCXText = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    logger.info(`Extracted text from DOCX: ${filePath}`);
    
    return {
      text: result.value,
      messages: result.messages
    };
  } catch (error) {
    logger.error(`Error extracting DOCX text: ${error.message}`);
    throw new Error(`Failed to extract DOCX: ${error.message}`);
  }
};

// Extract text from DOC (older format)
exports.extractDOCText = async (filePath) => {
  try {
    // mammoth also supports .doc files
    const result = await mammoth.extractRawText({ path: filePath });
    
    logger.info(`Extracted text from DOC: ${filePath}`);
    
    return {
      text: result.value,
      messages: result.messages
    };
  } catch (error) {
    logger.error(`Error extracting DOC text: ${error.message}`);
    throw new Error(`Failed to extract DOC: ${error.message}`);
  }
};

// Main function to extract text based on file type
exports.extractTextFromFile = async (filePath, mimeType) => {
  try {
    let result;

    if (mimeType === 'application/pdf') {
      result = await exports.extractPDFText(filePath);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      result = await exports.extractDOCXText(filePath);
    } else if (mimeType === 'application/msword') {
      result = await exports.extractDOCText(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    return result.text;
  } catch (error) {
    logger.error(`Error extracting text from file: ${error.message}`);
    throw error;
  }
};

// Delete file
exports.deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    return false;
  }
};

// Check if file exists
exports.fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

module.exports = exports;
