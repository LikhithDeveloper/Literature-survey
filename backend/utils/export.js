const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const logger = require('../config/logger');

// Export to PDF
exports.exportToPDF = async (survey) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add content
      doc.fontSize(24).text('Literature Survey', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text(survey.topic, { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Add survey content
      if (survey.generatedSurvey && survey.generatedSurvey.content) {
        doc.fontSize(11).text(survey.generatedSurvey.content, {
          align: 'justify'
        });
      }

      doc.end();
    } catch (error) {
      logger.error(`Error exporting to PDF: ${error.message}`);
      reject(error);
    }
  });
};

// Export to DOCX
exports.exportToDOCX = async (survey) => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'Literature Survey',
            heading: HeadingLevel.TITLE,
            alignment: 'center'
          }),
          new Paragraph({
            text: survey.topic,
            heading: HeadingLevel.HEADING_1,
            alignment: 'center'
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: survey.generatedSurvey?.content || '',
            spacing: { line: 360 }
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    logger.error(`Error exporting to DOCX: ${error.message}`);
    throw error;
  }
};

// Export to Markdown
exports.exportToMarkdown = (survey) => {
  let markdown = `# Literature Survey\n\n`;
  markdown += `## ${survey.topic}\n\n`;
  markdown += `**Generated on:** ${new Date().toLocaleDateString()}\n\n`;
  markdown += `---\n\n`;
  
  if (survey.generatedSurvey && survey.generatedSurvey.content) {
    markdown += survey.generatedSurvey.content;
  }

  return markdown;
};

module.exports = exports;
