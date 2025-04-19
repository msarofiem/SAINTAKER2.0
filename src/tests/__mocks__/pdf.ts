export const generatePdf = jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content'));
export const generateDocumentFromTemplate = jest.fn().mockResolvedValue(Buffer.from('mock-document-content'));
