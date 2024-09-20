const puppeteer = require('puppeteer');
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function textToJson(text) {
    return { url: text };
}

// async function fetchJsonData() {
//     // Launch Puppeteer
//     const browser = await puppeteer.launch({
//         headless:true,
//         executablePath: '/usr/bin/chromium',
//         args: [
//             '--no-sandbox', 
//             '--disable-setuid-sandbox',
//             '--disable-dev-shm-usage', // Prevents issues with shared memory
//             '--disable-extensions',
//             '--disable-gpu',
//             '--no-zygote',
//             '--single-process'
//         ]
//     });
//     const page = await browser.newPage();

//     let downloadUrl = null;

//     await page.setRequestInterception(true);
//     page.on('request', request => {
//         // Check if the request is a download
//         if (request.url().includes('.mkv')) {
//             downloadUrl = request.url(); // Store the download URL
//             // console.log('Download URL:', downloadUrl);
//         }
//         request.continue();
//     });

//     // Load the webpage
//     await page.goto('https://www.playbook.com/s/will-meet/wSCRJpv1AQVCEkwCeC4LWGAm?assetToken=3r7BbmWjnrbcZQCs7dDJFcyr', { waitUntil: 'networkidle2', timeout: 180000 });

//     // Wait for the SVG with `data-icon="download"` to appear
//     await page.waitForSelector('svg[data-icon="download"]');

//     // Wait for 5 seconds before interacting with the SVG
//     await delay(5000); // Wait for 5 seconds (5000 milliseconds)

//     // Find the SVG element using the CSS attribute selector
//     const svgElement = await page.$('svg[data-icon="download"]');

//     if (svgElement) {
//         // Click the SVG element if it exists
//         await svgElement.click();
//         // console.log('SVG with data-icon="download" clicked!');
//     } else {
//         // console.log('SVG with data-icon="download" not found.');
//     }
//     await delay(2000);
//     // Save the HTML content to a file
//     // fs.writeFileSync('page-content.txt', htmlContent);

//     // Close the browser
//     await browser.close();
//     console.log(textToJson(downloadUrl))
//     return textToJson(downloadUrl);
// }

// fetchJsonData();

// Endpoint to serve JSON data

async function fetchJsonData(url) {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless:true,
        // executablePath: '/usr/bin/chromium',
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
    // console.log(url);
    // Load the webpage
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });

   // Search for the <a> tag with an href that contains "assetToken"
   const assetTokenLink = await page.evaluate(() => {
    // Find all anchor tags on the page
    const anchors = Array.from(document.querySelectorAll('a'));

    // Look for an anchor tag whose href contains "assetToken"
    const anchor = anchors.find(a => a.href.includes('assetToken'));

    // Return the href or null if not found
    return anchor ? anchor.href : null;
    });
    let assetToken="";
    // Log the result
    if (assetTokenLink) {
        assetToken = (assetTokenLink.toString()).split('=')[1];
        // console.log('Found assetToken link:', assetTokenLink);
        // const link = fetchData(assetToken);
        // console.log(link);
    } else {
        console.log('No link with assetToken found.');
    }
    await browser.close();
    // console.log(textToJson(downloadUrl))
    return assetToken;
}

async function fetchData(token) {
    try {
        const response = await axios.get('https://be.playbook.com/graphql', {
            params: {
                operationName: 'AssetSignedDownloadUrlQuery',
                variables: JSON.stringify({
                    assetToken: token
                }),
                extensions: '{"operationId":"graphql-frontend-prod/61cfc4ae0c63221cc1d5ca47f13250c5"}'
            },
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MjU1MDU2MiwicGFzc3dvcmQiOiIkMmEkMTAkLldSQ2FJYnUwRDFNWUtzY3J0ZjBILlJYRW5jbEx5TElmekVPTUIuL2RQc2FxVDNEbWJ3TE8iLCJleHAiOjE3MjkzMjA1NTQsImp0aSI6IjA4MWZiZTQwLWQyOTAtNGE0MS1iYmMzLWMxNGQ5YTdmOTIyMyJ9.e5-4gOpHFDl6VpZmK0XhoYesU4AVRLLJPY7V0hBb-8I',
                'Content-Type': 'application/json',
                'organization': 'nikhatraste',
                // 'Cookie': '_session_id=4%2FvPAK%2F5ztsQ3jDf1tnZ2FShbgjeGFF0QokGFYs3bVa39pOuleiRWgAq08dSKDRKDV8C7OkZcBMoj3AXU91yGAk2fhMs1ABUKiBNGnQwbOn%2By2Hsr73EZKKYonaBctlRrBDYx5eTZPZgSnVuzX%2B170BgtHjhvmyijDB1iUMU1dE15zSVpspGIrWqDhXlbdFMH3WHtybRYgOtf2M3fVnFI8IylLmLNYcAc1WUUP%2Bgzqv%2F2oVvyJFvDgTEfb7MwkTichdihM47%2Bv5jwN9SDbONcttkb8wqvMxBHuLxNeGTo5%2FuD5%2FnWIORW0wBlQSM15gLP7FA8jTPAIW3%2B1LAFQSBZ%2Fu1UdRtcxqfTqWG9pZf3Ak6%2BzclfC1ApEaRUOHbItiKRL44RPJiZtOLhrHw1%2FHfW0pxeh2mwoEyGedx4lLLkOmEQsEjLDf03BRscWmp1AK1nujo1Hfpi1TTKab9xJN%2B5aMFeiUCAnqhLDPy6Wk7qDPawqZPzagumW6QMf2hYu9Rai349rNJ4fGksi28NLci44%2B8eXSVT7ETFobCYQMufarCwaFqAV1fR%2Bf%2F03gI%2Fn8PyX%2BAoEkoGyPQR11DqGhDIbOo0auXiIg7TRdQEMaI21ty%2FQXDaipX%2Bq6jzQ5R3ucI%2Fitm5yi5e%2F6BiBr9WrNo--eA0bUaHcg8j%2Fc%2FMj--qTNgCHDYbfIn%2FqYSSAMeQw%3D%3D'
            }
        });
        const signedDownloadUrl = response.data?.data?.asset?.signedDownloadUrl;
        return signedDownloadUrl;
    } catch (error) {
        if (error.response) {
            console.log('Error Response:', error.response.status, error.response.statusText);
            console.log('Error Data:', error.response.data.toString());
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

app.get('/api/data', async (req, res) => {
    try {
        const url = req.query.url;
        const data = await fetchJsonData(url);
        const check = await fetchData(data);
        res.json(check);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static HTML files from the 'public' directory
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}).setTimeout(600000);;

