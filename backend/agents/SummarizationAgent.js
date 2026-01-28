const { generateCompletion } = require('../utils/groq');
const Survey = require('../models/Survey');
const logger = require('../config/logger');

class SummarizationAgent {
  constructor(surveyId, topic, additionalInfo, retrievedPapers, documents) {
    this.surveyId = surveyId;
    this.topic = topic;
    this.additionalInfo = additionalInfo || '';
    this.retrievedPapers = retrievedPapers || [];
    this.documents = documents || [];
  }

  async execute(progressCallback) {
    try {
      logger.info(`[Agent 3] Starting Summarization for survey: ${this.surveyId}`);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 10,
          message: 'Analyzing retrieved papers and documents...'
        });
      }

      // Generate comprehensive literature survey
      const survey = await this.generateLiteratureSurvey(progressCallback);

      logger.info(`[Agent 3] Completed. Generated ${survey.wordCount} words`);

      return {
        success: true,
        content: survey.content,
        wordCount: survey.wordCount,
        sections: survey.sections
      };
    } catch (error) {
      logger.error(`[Agent 3] Error in Summarization Agent: ${error.message}`);
      throw error;
    }
  }

  async generateLiteratureSurvey(progressCallback) {
    try {
      // Prepare context from papers and documents
      const context = this.prepareContext();

      // Helper function to add delay between API calls
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 15,
          message: 'Generating abstract...'
        });
      }

      // Generate abstract first
      const abstract = await this.generateAbstract(context);
      await delay(1000); // 1 second delay

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 20,
          message: 'Generating introduction...'
        });
      }

      // Generate each section with delays
      const introduction = await this.generateIntroduction(context);
      await delay(1000);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 35,
          message: 'Generating background and literature review...'
        });
      }

      const background = await this.generateBackground(context);
      await delay(1000);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 50,
          message: 'Analyzing methodologies...'
        });
      }

      const methodology = await this.generateMethodology(context);
      await delay(1000);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 65,
          message: 'Synthesizing key findings...'
        });
      }

      const findings = await this.generateFindings(context);
      await delay(1000);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 75,
          message: 'Generating discussion...'
        });
      }

      const discussion = await this.generateDiscussion(context);
      await delay(1000);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 85,
          message: 'Generating future research directions...'
        });
      }

      const futureWork = await this.generateFutureWork(context);
      await delay(1000);

      if (progressCallback) {
        progressCallback({
          agent: 'summarization',
          progress: 95,
          message: 'Writing conclusion...'
        });
      }

      const conclusion = await this.generateConclusion(context);

      // Combine all sections
      const fullContent = `# Literature Survey: ${this.topic}

## Abstract

${abstract}

## 1. Introduction

${introduction}

## 2. Background and Related Work

${background}

## 3. Methodology and Approaches

${methodology}

## 4. Key Findings and Results

${findings}

## 5. Discussion and Analysis

${discussion}

## 6. Future Research Directions

${futureWork}

## 7. Conclusion

${conclusion}

---
*This literature survey was generated based on ${this.retrievedPapers.length} research papers and ${this.documents.length} uploaded documents.*
`;

      const wordCount = fullContent.split(/\s+/).length;

      return {
        content: fullContent,
        wordCount: wordCount,
        sections: [
          { title: 'Abstract', content: abstract, order: 0 },
          { title: 'Introduction', content: introduction, order: 1 },
          { title: 'Background and Related Work', content: background, order: 2 },
          { title: 'Methodology and Approaches', content: methodology, order: 3 },
          { title: 'Key Findings and Results', content: findings, order: 4 },
          { title: 'Discussion and Analysis', content: discussion, order: 5 },
          { title: 'Future Research Directions', content: futureWork, order: 6 },
          { title: 'Conclusion', content: conclusion, order: 7 }
        ]
      };
    } catch (error) {
      logger.error(`[Agent 3] Error generating literature survey: ${error.message}`);
      throw error;
    }
  }

  prepareContext() {
    let context = `Topic: ${this.topic}\n`;
    
    if (this.additionalInfo) {
      context += `Additional Information: ${this.additionalInfo}\n`;
    }

    context += `\nRetrieved Papers (${this.retrievedPapers.length}):\n`;
    this.retrievedPapers.slice(0, 20).forEach((paper, index) => {
      context += `${index + 1}. ${paper.title}`;
      if (paper.authors && paper.authors.length > 0) {
        context += ` by ${paper.authors.slice(0, 3).join(', ')}`;
      }
      if (paper.year) {
        context += ` (${paper.year})`;
      }
      if (paper.abstract) {
        context += `\n   Abstract: ${paper.abstract.substring(0, 300)}...`;
      }
      context += '\n';
    });

    return context;
  }

  async generateAbstract(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a concise abstract (150-200 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write an abstract for a literature survey on the following topic:\n\n${context}\n\nThe abstract should summarize the scope, key themes, and main contributions.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 300, temperature: 0.7 });
  }

  async generateIntroduction(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a concise introduction section (300-400 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write an introduction for a literature survey on:\n\n${context}\n\nInclude:\n1. Background and motivation\n2. Importance of the topic\n3. Scope of the survey\n\nKeep it focused and relevant.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 600, temperature: 0.7 });
  }

  async generateBackground(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a focused background section (400-500 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write a background and literature review section for:\n\n${context}\n\nInclude:\n1. Key concepts\n2. Major research areas\n3. Seminal works\n\nFocus on the most important aspects.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 800, temperature: 0.7 });
  }

  async generateMethodology(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a concise methodology section (300-400 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write a methodology section for:\n\n${context}\n\nInclude:\n1. Common research methodologies\n2. Approaches used in key papers\n\nSummarize the main technical approaches.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 600, temperature: 0.7 });
  }

  async generateFindings(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a focused findings section (400-500 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write a findings and results section for:\n\n${context}\n\nInclude:\n1. Major findings from the literature\n2. Key outcomes and comparisons\n\nHighlight the most significant results.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 800, temperature: 0.7 });
  }

  async generateDiscussion(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a concise discussion section (300-400 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write a discussion section for:\n\n${context}\n\nInclude:\n1. Critical analysis\n2. Comparison of approaches\n3. Practical implications\n\nProvide clear insights.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 600, temperature: 0.7 });
  }

  async generateFutureWork(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a concise future work section (200-300 words).'
      },
      {
        role: 'user',
        content: `Write a future research directions section for:\n\n${context}\n\nInclude:\n1. Open research questions\n2. Emerging opportunities\n\nBe specific and forward-looking.`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 500, temperature: 0.7 });
  }

  async generateConclusion(context) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert academic writer. Write a concise conclusion (150-200 words) for a literature survey.'
      },
      {
        role: 'user',
        content: `Write a conclusion for a literature survey on:\n\n${context}\n\nInclude:\n1. Summary of key contributions\n2. Final recommendations`
      }
    ];

    return await generateCompletion(messages, { maxTokens: 400, temperature: 0.7 });
  }
}

module.exports = SummarizationAgent;
