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


async function fetchJsonData(url) {
    const browser = await puppeteer.launch({
        headless:true,
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', 
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
        if (request.url().includes('.mkv')) {
            downloadUrl = request.url(); 
        }
        request.continue();
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });

   const assetTokenLink = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    const anchor = anchors.find(a => a.href.includes('assetToken'));
    return anchor ? anchor.href : null;
    });
    let assetToken="";
    if (assetTokenLink) {
        assetToken = (assetTokenLink.toString()).split('=')[1];
    } else {
        console.log('No link with assetToken found.');
    }
    await browser.close();
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
                'organization': 'nikhatraste'}
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

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
}).setTimeout(600000);;

