require("dotenv").config();
const { google } = require("googleapis");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Load credentials from environment OR local file
let credentials;
if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64").toString("utf-8")
  );
} else {
  const filePath = path.join(__dirname, "credentials.json");
  if (!fs.existsSync(filePath)) {
    console.error("❌ credentials.json not found and GOOGLE_CREDENTIALS_BASE64 not set.");
    process.exit(1);
  }
  credentials = JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Spreadsheet configuration
const SPREADSHEET_ID = "1bsS9b0FDjzPghhAfMW0YRsTdNnKdN6QMC6TS8vxlsJg";
const SHEET_NAME = "Sheet2";

// Authorize Google Sheets API
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

// Fetch URL from Sheet2!B2
async function getUrlFromSheet(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B2`,
  });
  return res.data.values?.[0]?.[0];
}

// Scrape all hyperlinks from the URL
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

// Write links to Sheet2!B6
async function writeLinksToSheet(sheets, links) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B6`,
    valueInputOption: "RAW",
    resource: { values: links },
  });
}

// Main function
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
