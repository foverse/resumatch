import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from Vite build (dist)
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(__dirname)); // Fallback for raw static assets

function getBrowserExecutable() {
    const candidatePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
        (process.env.LOCALAPPDATA || '') + '\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of candidatePaths) {
        if (p && fs.existsSync(p)) {
            return p;
        }
    }
    return undefined;
}

app.post('/api/export-pdf', async (req, res) => {
    let browser;
    try {
        const { html, css } = req.body;

        if (!html) {
            return res.status(400).send('HTML content is required');
        }

        console.log('Launching browser for PDF generation...');
        
        const executablePath = getBrowserExecutable();
        const launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        };
        if (executablePath) {
            launchOptions.executablePath = executablePath;
            console.log('Using browser executable at:', executablePath);
        }

        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (launchErr) {
            console.warn('Failed launching with executablePath, retrying default:', launchErr.message);
            delete launchOptions.executablePath;
            browser = await puppeteer.launch(launchOptions);
        }
        
        const page = await browser.newPage();
        await page.emulateMediaType('print');

        // Construct full page HTML with base tag for relative images
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <base href="http://localhost:${PORT}/" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    ${css || ''}
                    
                    /* Reset body margin and force A4 print */
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        width: 210mm !important;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    /* Ensure backgrounds are printed */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                ${html}
            </body>
            </html>
        `;

        await page.setContent(fullHtml, { waitUntil: 'load', timeout: 15000 }).catch(e => {
            console.warn('page.setContent timed out waiting for load, proceeding anyway:', e.message);
        });

        // Determine exact page count (strict 1-page max for single CV)
        const paperCount = (html.match(/class="[^"]*cv-paper/g) || []).length || 1;
        const pageRanges = `1-${paperCount}`;

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            pageRanges: pageRanges,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        console.log('PDF generated successfully, size:', pdfBuffer.length);

        // Send PDF response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'attachment; filename="cv.pdf"'
        });
        
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF: ' + error.message);
    } finally {
        if (browser) {
            await browser.close().catch(err => console.error('Error closing browser:', err));
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Ready to generate PDFs at POST /api/export-pdf');
});
