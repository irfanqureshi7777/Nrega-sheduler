const puppeteer = require('puppeteer');

async function scrapeNregaData() {
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();

    // Open the provided URL with all query parameters
    const url = 'https://nregastrep.nic.in/netnrega/dynamic_muster_track.aspx?lflag=eng&state_code=17&fin_year=2025-2026&state_name=%u092e%u0927%u094d%u092f+%u092a%u094d%u0930%u0926%u0947%u0936+&Digest=%2f0dclwkJQM2w4GAt8GjFPw';

    console.log("🔄 Navigating to page...");
    await page.goto(url, {
        waitUntil: 'domcontentloaded' // Wait for the page to load completely
    });

    console.log("📄 Page loaded. Waiting for state_code dropdown...");

    try {
        // Wait for the state dropdown to load
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ddl_state', { timeout: 60000 });
        console.log("✔️ State dropdown loaded.");

        // Select the state code (17 for Madhya Pradesh)
        await page.select('#ctl00_ContentPlaceHolder1_ddl_state', '17');
        console.log("✔️ State selected: Madhya Pradesh");

        // Wait for the district dropdown to load after selecting the state
        console.log("🔄 Waiting for district dropdown...");
       
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ddl_district', { timeout: 90000 });
await page.select('#ctl00_ContentPlaceHolder1_ddl_district', '1738');
        console.log("✔️ District dropdown loaded.");

        // Ensure that district options are populated
        console.log("🔄 Checking if district dropdown has options...");
        const districtVisible = await page.$eval('#ctl00_ContentPlaceHolder1_ddl_district', el => el.options.length > 1);
        if (!districtVisible) {
            console.log("❌ No district options available.");
            await page.waitForTimeout(5000); // Wait extra 5 seconds for dynamic loading
        }

        // Select the district (district code 1 for Balaghat as an example)
        await page.select('#ctl00_ContentPlaceHolder1_ddl_district', '1');  // Update with the correct district code
        console.log("✔️ District selected: Balaghat");

        // Wait for the block dropdown to load after selecting the district
        console.log("🔄 Waiting for block dropdown...");
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ddl_block', { timeout: 60000 });
        console.log("✔️ Block dropdown loaded.");

        // Ensure that block options are populated
        await page.waitForTimeout(2000); // Give some time for the dropdown to populate

        // Select the block (block code 1 for Khairlanji as an example)
        await page.select('#ctl00_ContentPlaceHolder1_ddl_block', '1');  // Update with the correct block code
        console.log("✔️ Block selected: Khairlanji");

        // Wait for the panchayat dropdown to load after selecting the block
        console.log("🔄 Waiting for panchayat dropdown...");
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_ddl_panchayat', { timeout: 60000 });
        console.log("✔️ Panchayat dropdown loaded.");

        // Ensure that panchayat options are populated
        await page.waitForTimeout(2000); // Give some time for the dropdown to populate

        // Select the panchayat (panchayat code 1 for Amai as an example)
        await page.select('#ctl00_ContentPlaceHolder1_ddl_panchayat', '1');  // Update with the correct panchayat code
        console.log("✔️ Panchayat selected: Amai");

        // Wait for the radio button to load and click it
        await page.waitForSelector('input[type="radio"][name="ctl00$ContentPlaceHolder1$rbl_option"]', { timeout: 60000 });
        await page.click('input[type="radio"][name="ctl00$ContentPlaceHolder1$rbl_option"]');
        console.log("✔️ Radio button selected.");

        // Wait for the submit button to appear and click it
        console.log("📄 Waiting for submit button...");
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_btn_submit', { timeout: 60000 });
        await page.click('#ctl00_ContentPlaceHolder1_btn_submit');
        console.log("✔️ Form submitted.");

        // Wait for the next page or result to load
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        console.log("✔️ Data scraping process completed.");

        // You can now add your code to scrape the table data after form submission
        // Example: Extract table data (modify XPath if necessary)
        const tableXPath = '//*[@id="aspnetForm"]/div[3]/center[1]/table[2]';
        const tableElement = await page.$x(tableXPath);

        if (tableElement.length > 0) {
            console.log("✔️ Table found. Extracting data...");
            // Process table data here (extract rows, cells, etc.)
        } else {
            console.log("❌ Table not found.");
        }

    } catch (error) {
        console.log("❌ Error occurred: " + error.message);
    }

    await browser.close();
}

scrapeNregaData();
