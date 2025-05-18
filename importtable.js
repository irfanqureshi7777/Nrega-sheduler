const { google } = require('googleapis');
const axios = require('axios');
const { JWT } = require('google-auth-library');
const credentials = require('./credentials.json'); // Ensure this file exists and is valid

const spreadsheetId = '1bsS9b0FDjzPghhAfMW0YRsTdNnKdN6QMC6TS8vxlsJg';
const sheet3Range = 'Sheet3!B3:B';
const sheet5Range = 'Sheet5!C3:X';

// Google Sheets Auth
const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Step 1: Get URLs from Sheet3
async function getUrlsFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheet3Range,
  });
  return res.data.values?.flat().filter(url => url) || [];
}

// Step 2: Clear old data in Sheet5!C3:X
async function clearSheetData() {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheet5Range,
  });
}

// Step 3: Fetch table data from a URL
async function fetchTableData(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = response.data;
    const tables = html.match(/<table[\s\S]*?<\/table>/gi);
    if (!tables || tables.length < 4) return [];

    // Extract metadata
    const metaText = tables[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, ' ').toUpperCase();

    const extractValue = (label, nextLabel) => {
      const pattern = new RegExp(label + "\\s*:?[\\s]+([A-Z\\-\\/\\(\\)\\s]+?)\\s+" + nextLabel, "i");
      const match = metaText.match(pattern);
      return match ? match[1].trim() : null;
    };

    const district = extractValue("DISTRICT", "BLOCK") || extractValue("DISTRICT", "GRAM") || extractValue("DISTRICT", "PANCHAYAT");
    const block = extractValue("BLOCK", "PANCHAYAT") || extractValue("BLOCK", "GRAM");
    const panchayatMatch = metaText.match(/PANCHAYAT\s*:?\s*([A-Z0-9\-\(\)\/\s]+)/i);
    const panchayat = panchayatMatch ? panchayatMatch[1].trim() : null;
    const state = "MADHYA PRADESH";
    const finYear = (url.match(/fin_year=([\d\-]+)/i) || [null, "UNKNOWN"])[1];

    // Extract data rows (skip header and footer)
    const rowMatches = tables[3].match(/<tr[\s\S]*?<\/tr>/gi);
    if (!rowMatches || rowMatches.length <= 4) return [];

    const dataRows = rowMatches.slice(3, rowMatches.length - 1);
    const parsedData = [];

    dataRows.forEach(row => {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
      if (!cells) return;
      const rowData = cells.map(cell => cell.replace(/<[^>]+>/g, '').trim());
      parsedData.push([state, district, block, panchayat, finYear, ...rowData]);
    });

    return parsedData;
  } catch (error) {
    console.error(`❌ Error fetching URL (${url}):`, error.message);
    return [];
  }
}

// Step 4: Write all collected data to Sheet5
async function writeDataToSheet(data) {
  if (data.length === 0) return 0;

  const maxCols = Math.max(...data.map(r => r.length));
  const values = data.map(row => {
    while (row.length < maxCols) row.push("");
    return row;
  });

  const startRow = 3;
  const endRow = startRow + values.length - 1;
  const endCol = String.fromCharCode(67 + maxCols - 1); // 67 = ASCII for 'C'
  const range = `Sheet5!C${startRow}:${endCol}${endRow}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  return values.length;
}

// Main function to run all steps
async function importAndFlattenTables() {
  try {
    await clearSheetData();

    // Write column headers
    const headers = ["STATE", "DISTRICT", "BLOCK", "PANCHAYAT", "FIN YEAR"];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet5!C2',
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });

    const urls = await getUrlsFromSheet();
    console.log(`🌐 Found ${urls.length} URLs. Fetching data...`);

    const allDataPromises = urls.map(url => fetchTableData(url));
    const allDataArrays = await Promise.all(allDataPromises);
    const allData = allDataArrays.flat();

    if (allData.length > 0) {
      const rowsWritten = await writeDataToSheet(allData);
      console.log(`✅ Wrote ${rowsWritten} rows to Sheet5 starting from C3.`);
    } else {
      console.log("⚠️ No data to write.");
    }

    console.log("✅ Import completed.");
  } catch (err) {
    console.error("❌ Error during the import process:", err.message);
  }
}

// Start the script
importAndFlattenTables();
