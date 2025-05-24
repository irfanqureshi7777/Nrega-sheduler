require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { google } = require('googleapis');

const SHEET_ID = '1vi-z__fFdVhUZr3PEDjhM83kqhFtbJX0Ejcfu9M8RKo';
const SHEET_RANGE = 'R1.1!A3';
const NREGA_URL = 'https://nreganarep.nic.in/netnrega/app_issue.aspx?page=b&lflag=&state_name=MADHYA+PRADESH&state_code=17&district_name=BALAGHAT&district_code=1738&block_code=1738002&block_name=KHAIRLANJI&fin_year=2025-2026&source=national&Digest=AS/EzXOjY5nZjEFgC7kuSQ';

async function scrapeTables() {
  const response = await axios.get(NREGA_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const $ = cheerio.load(response.data);
  const tables = $('table');

  const selectedIndexes = [1, 6]; // 2nd and 7th tables
  let finalData = [];

  selectedIndexes.forEach(i => {
    const table = tables.eq(i);
    if (!table) return;

    table.find('tr').each((_, row) => {
      const rowData = [];
      $(row).find('th, td').each((_, cell) => {
        rowData.push($(cell).text().trim());
      });
      if (rowData.length > 0) finalData.push(rowData);
    });
  });

  return finalData;
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

  const raw = (process.env.GOOGLE_CREDENTIALS_BASE64 || '').replace(/[\r\n]+/g, '');
  const jsonStr = Buffer.from(raw, 'base64').toString('utf-8').replace(/\\n/g, '\n');
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

  console.log('✅ Data written to', SHEET_RANGE);
}

(async () => {
  console.log('📡 Scraping NREGA...');
  const data = await scrapeTables();
  console.log(`✅ Scraped ${data.length} rows`);
  await writeToSheet(data);
})();