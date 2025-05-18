require('dotenv').config();

const puppeteer = require('puppeteer');
const { google } = require('googleapis');
const path = require('path');
const cron = require('node-cron');

const SHEET_ID = '1vi-z__fFdVhUZr3PEDjhM83kqhFtbJX0Ejcfu9M8RKo';
const SHEET_RANGE = 'R6.09!A3';

const NREGA_URL = 'https://nreganarep.nic.in/netnrega/dpc_sms_new.aspx?lflag=eng&page=b&Short_Name=MP&state_name=MADHYA+PRADESH&state_code=17&district_name=BALAGHAT&district_code=1738&block_name=KHAIRLANJI&block_code=1738002&fin_year=2025-2026&dt=&EDepartment=ALL&wrkcat=ALL&worktype=ALL&Digest=0Rg9WmyQmiHlGt6U8z1w4A';

async function scrapeTables() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(NREGA_URL, { waitUntil: 'networkidle0' });

  const allData = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    const selectedIndexes = [1, 4]; // 2nd and 5th tables (0-based index)

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

async function writeToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: 'RAW',
    requestBody: { values: data }
  });

  console.log('✅ Data successfully written to R1.1!');
}

