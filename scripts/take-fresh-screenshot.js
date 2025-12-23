const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:1313');
  await page.screenshot({path: '/Users/bryanchasko/Code/bryan-chasko-com/fresh-screenshot.png'});
  await browser.close();
})();
