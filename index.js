const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = 3000;

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function textToJson(text) {
    return { url: text };
}

async function fetchJsonData() {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless:true,
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Prevents issues with shared memory
            '--disable-extensions',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ]
    });
    const page = await browser.newPage();

    let downloadUrl = null;

    await page.setRequestInterception(true);
    page.on('request', request => {
        // Check if the request is a download
        if (request.url().includes('.mkv')) {
            downloadUrl = request.url(); // Store the download URL
            // console.log('Download URL:', downloadUrl);
        }
        request.continue();
    });

    // Load the webpage
    await page.goto('https://www.playbook.com/s/will-meet/wSCRJpv1AQVCEkwCeC4LWGAm?assetToken=3r7BbmWjnrbcZQCs7dDJFcyr', { waitUntil: 'networkidle2', timeout: 180000 });

    // Wait for the SVG with `data-icon="download"` to appear
    await page.waitForSelector('svg[data-icon="download"]');

    // Wait for 5 seconds before interacting with the SVG
    await delay(5000); // Wait for 5 seconds (5000 milliseconds)

    // Find the SVG element using the CSS attribute selector
    const svgElement = await page.$('svg[data-icon="download"]');

    if (svgElement) {
        // Click the SVG element if it exists
        await svgElement.click();
        // console.log('SVG with data-icon="download" clicked!');
    } else {
        // console.log('SVG with data-icon="download" not found.');
    }
    await delay(2000);
    // Save the HTML content to a file
    // fs.writeFileSync('page-content.txt', htmlContent);

    // Close the browser
    await browser.close();
    console.log(textToJson(downloadUrl))
    return textToJson(downloadUrl);
}

// fetchJsonData();

// Endpoint to serve JSON data
app.get('/api/data', async (req, res) => {
    try {
        const data = await fetchJsonData();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static HTML files from the 'public' directory
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}).setTimeout(600000);;

