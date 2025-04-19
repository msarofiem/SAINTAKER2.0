import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const templatesDir = path.join(process.cwd(), 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

/**
 * Generate a PDF from HTML content
 */
export const generatePdf = async (htmlContent: string, options = {}): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      ...options
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};

/**
 * Generate a document from a template
 */
export const generateDocumentFromTemplate = async (
  templateName: string,
  data: Record<string, any>
): Promise<Buffer> => {
  const templatePath = path.join(templatesDir, `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found`);
  }
  
  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    templateContent = templateContent.replace(regex, String(value));
  });
  
  return generatePdf(templateContent);
};

/**
 * Create a simple PDF document using pdf-lib
 */
export const createSimplePdf = async (
  title: string,
  content: string[]
): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  
  page.drawText(title, {
    x: 50,
    y: height - 50,
    size: 16,
    font,
    color: rgb(0, 0, 0)
  });
  
  content.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: height - 100 - (index * 20),
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
