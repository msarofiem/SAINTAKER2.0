import puppeteer from 'puppeteer';

export async function generatePdf(htmlContent: string, outputPath: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    await page.addStyleTag({
      content: `
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 2cm;
        }
        h1 {
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        h2 {
          color: #555;
          margin-top: 20px;
        }
      `
    });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });
    
    return outputPath;
  } finally {
    await browser.close();
  }
}
