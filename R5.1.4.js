require('dotenv').config();
const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SHEET_ID = '1vi-z__fFdVhUZr3PEDjhM83kqhFtbJX0Ejcfu9M8RKo';
const SHEET_RANGE = 'achiv!A4';
const NREGA_URL = 'https://nreganarep.nic.in/netnrega/demand_emp_demand.aspx?file1=empprov&page1=b&lflag=eng&state_name=MADHYA+PRADESH&state_code=17&district_name=BALAGHAT&district_code=1738&block_code=1738002&block_name=KHAIRLANJI&fin_year=2025-2026&source=national&rbl=0&rblhpb=Both&Digest=oDzFUp3uDTVmeqEgUV5uKA';

async function scrapeTables() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(NREGA_URL, { waitUntil: 'networkidle0' });

  const allData = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    const selectedIndexes = [1, 8]; // 2nd and 9th tables (0-based index)

    let finalData = [];
    selectedIndexes.forEach(index => {
      const table = tables[index];
      if (table) {
        const rows = Array.from(table.querySelectorAll('tr')).map(row =>
          Array.from(row.querySelectorAll('th, td')).map(cell =>
            cell.innerText.trim()
          )
        );
        finalData = finalData.concat(rows);
      }
    });

    return finalData;
  });

  await browser.close();
  return allData;
}

function getGoogleAuthClient() {
  const credPath = path.join(__dirname, 'credentials.json');

  // Case 1: Local file exists
  if (fs.existsSync(credPath)) {
    const creds = require(credPath);
    return new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
  }

  // Case 2: Use Render/GitHub Base64 env variable
  const base64 = process.env.GOOGLE_CREDENTIALS_BASE64 || '';
  const jsonStr = Buffer.from(base64, 'base64').toString('utf-8').replace(/\\n/g, '\n');
  const creds = JSON.parse(jsonStr);

  return new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function writeToSheet(data) {
  const auth = getGoogleAuthClient();
  await auth.authorize();

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: 'RAW',
    requestBody: { values: data }
  });

  console.log('✅ Data successfully written to R5.1.4!');
}

(async () => {
  try {
    console.log('⏱️ Starting one-time scrape...');
    const data = await scrapeTables();
    console.log(`📋 Scraped ${data.length} rows.`);
    await writeToSheet(data);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
