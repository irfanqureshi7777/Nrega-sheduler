// Schedule scraping every day at 7:00 AM IST
cron.schedule('* * * * *', async () => {
  try {
    console.log('⏱️ Scheduled scrape running...');
    const data = await scrapeTables();
    console.log(`📋 Scraped ${data.length} rows.`);
    await writeToSheet(data);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}, {
  timezone: 'Asia/Kolkata'
});




// Schedule scraping daily at 7:00 AM
cron.schedule('* * * * *', async () => {
  try {
    console.log('⏱️ Scheduled scrape running...');
    const data = await scrapeTables();
    console.log(`📋 Scraped ${data.length} rows.`);
    await writeToSheet(data);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});






// ✅ Run this every minute
cron.schedule('* * * * *', async () => {


  console.log('✅ Data successfully written to Sheet1!');
})

// ✅ Run this every minute
cron.schedule('* * * * *', async () => {

  try {
    console.log('⏱️ Scheduled scrape running...');
    const data = await scrapeTables();
    console.log(`📋 Scraped ${data.length} rows.`);
    await writeToSheet(data);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});
