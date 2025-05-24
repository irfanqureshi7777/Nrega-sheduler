require('dotenv').config();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { google } = require('googleapis');

const SHEET_ID    = '1vi-z__fFdVhUZr3PEDjhM83kqhFtbJX0Ejcfu9M8RKo';
const SHEET_RANGE = 'R1.1!A3';
const NREGA_URL   = 'https://nreganarep.nic.in/netnrega/app_issue.aspx?page=b&lflag=&state_name=MADHYA+PRADESH&state_code=17&district_name=BALAGHAT&district_code=1738&block_code=1738002&block_name=KHAIRLANJI&fin_year=2025-2026&source=national&Digest=AS/EzXOjY5nZjEFgC7kuSQ';

async function scrapeTables() {
  console.log('🕸️ Launching browser to scrape tables...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(NREGA_URL, { waitUntil: 'networkidle0' });

  const allData = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    const selectedIndexes = [1, 6]; // 2nd and 7th tables
    let finalData = [];

    selectedIndexes.forEach(i => {
      const table = tables[i];
      if (!table) return;
      const rows = Array.from(table.querySelectorAll('tr')).map(row =>
        Array.from(row.querySelectorAll('th, td')).map(cell =>
          cell.innerText.trim()
        )
      );
      finalData = finalData.concat(rows);
    });

    return finalData;
  });

  await browser.close();
  console.log('✅ Scraping complete.');
  return allData;
}

function getGoogleAuthClient() {
  const credPath = path.join(__dirname, 'credentials.json');
  if (fs.existsSync(credPath)) {
    const creds = require(credPath);
    return new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
  }

  let raw = (process.env.GOOGLE_CREDENTIALS_BASE64 || '').replace(/[\r\n]+/g, '');
  let jsonStr = Buffer.from(raw, 'base64').toString('utf-8');
  jsonStr = jsonStr.replace(/\\n/g, '\n');
  const creds = JSON.parse(jsonStr);

  return new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function writeToSheet(data) {
  const authClient = getGoogleAuthClient();
  await authClient.authorize();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: 'RAW',
    requestBody: { values: data }
  });

  console.log('✅ Data successfully written to', SHEET_RANGE);
}

// Run immediately
(async () => {
  console.log('🚀 R1.1.js started at', new Date().toLocaleString());

  try {
    const data = await scrapeTables();
    console.log(`📋 Scraped ${data.length} rows.`);

    if (data.length === 0) {
      console.warn('⚠️ No data scraped. Check the site structure or URL.');
    }

    await writeToSheet(data);
    console.log('✅ Sheet update completed at', new Date().toLocaleString());
  } catch (err) {
    console.error('❌ Error during execution:', err.message);
    console.error(err);
  }
})();