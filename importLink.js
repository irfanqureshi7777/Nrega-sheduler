// Load environment variables from .env file
require("dotenv").config();

const { google } = require("googleapis");
const axios = require("axios");
const cheerio = require("cheerio");

// Decode the base64-encoded credentials from environment variable
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf-8")
);

// Spreadsheet configuration
const SPREADSHEET_ID = "1bsS9b0FDjzPghhAfMW0YRsTdNnKdN6QMC6TS8vxlsJg";
const SHEET_NAME = "Sheet2";

// Authorize Google Sheets API using service account credentials
async function authorize() {
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

// Fetch the target URL from the sheet cell B2
async function getUrlFromSheet(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B2`,
  });
  return res.data.values?.[0]?.[0];
}

// Scrape all hyperlinks from the fetched URL
async function fetchHyperlinks(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const links = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) links.push([href]);
  });
  return links;
}

// Write the hyperlinks to the sheet starting from cell B6
async function writeLinksToSheet(sheets, links) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B6`,
    valueInputOption: "RAW",
    resource: { values: links },
  });
}

// Main function to run everything
(async () => {
  try {
    const sheets = await authorize();
    const url = await getUrlFromSheet(sheets);
    if (!url) throw new Error("URL not found in Sheet2!B2");

    const links = await fetchHyperlinks(url);
    await writeLinksToSheet(sheets, links);

    console.log(`✅ Imported ${links.length} hyperlinks to ${SHEET_NAME}!B6:B`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
