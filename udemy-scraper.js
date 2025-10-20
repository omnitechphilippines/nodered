import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// Usage: node udemy-scraper.js "<URL>" [cookieFileOrJson] [output_file.html]
const url = process.argv[2];
const cookieArg = process.argv[3] || null;
const outFile = process.argv[4] || null;

if (!url) {
    console.error('Usage: node udemy-scraper.js "<URL>" [cookieFileOrJson] [output_file.html]');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    await page.setViewport({ width: 1366, height: 768 });

    // ✅ Load cookies if provided
    if (cookieArg) {
        try {
            let cookies;
            if (fs.existsSync(cookieArg)) {
                cookies = JSON.parse(fs.readFileSync(cookieArg, 'utf8'));
                // console.log(`Loaded cookies from file: ${cookieArg}`);
            } else {
                cookies = JSON.parse(cookieArg);
                // console.log('Loaded cookies from JSON argument');
            }
            await page.setCookie(...cookies);
        } catch (err) {
            console.error('⚠️ Failed to load cookies:', err.message);
        }
    }

    // console.log(`Opening: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // ✅ Wait for the page to render key UI parts
    // Some "Go to course" buttons load later than "Enroll now"
    try {
        await page.waitForSelector('[data-purpose="buy-this-course-button"]', { timeout: 20000 });
    } catch {
        console.warn('⚠️ buy-this-course-button not found immediately, waiting for text...');
        // fallback: wait for visible button text
        await page.waitForFunction(
            () =>
                document.body.innerText.includes('Go to course') ||
                document.body.innerText.includes('Enroll now'),
            { timeout: 30000 }
        );
    }

    // ✅ Extract HTML after rendering
    const html = await page.content();

    // ✅ Check if free course (price = 0.0)
    const isFree = html.match(/"price":\s*0\.0/g);

    // ✅ Detect button text (Enroll now / Go to course)
    const statusText = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button[data-purpose]')];
        let found = null;
        for (const b of btns) {
            const text = b.innerText.trim();
            if (/enroll now/i.test(text) || /go to course/i.test(text)) {
                found = text;
                break;
            }
        }
        // fallback: if not found, check body text
        if (!found && document.body) {
            const t = document.body.innerText;
            if (/go to course/i.test(t)) found = 'Go to course';
            else if (/enroll now/i.test(t)) found = 'Enroll now';
        }
        return found;
    });

    // if (isFree) {
    //     if (/enroll/i.test(statusText)) {
    //         console.log(`🟢 FREE & not enrolled → "Enroll now" found at ${url}`);
    //     } else if (/go to course/i.test(statusText)) {
    //         console.log(`🟡 Already enrolled → "Go to course" found at ${url}`);
    //     } else {
    //         console.log(`⚪ Free but button not found at ${url}`);
    //     }
    // } else {
    //     console.log(`🔴 Not free: ${url}`);
    // }

    if (isFree && /enroll/i.test(statusText)) {
        console.log(url);
    } else {
        console.log('Not valid');
    }

    // ✅ Optionally save HTML
    if (outFile) {
        try {
            fs.writeFileSync(outFile, html, 'utf8');
            console.error(`Saved HTML to ${outFile}`);
        } catch (err) {
            console.error('Error saving file:', err.message);
        }
    }

    await browser.close();
})();
