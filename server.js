const express = require("express");
const puppeteer = require("puppeteer"); // ✅ NOT puppeteer-core

const app = express();

// ✅ centralized browser launcher
async function launchBrowser() {
  return await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ],
  });
}

// ================= CATALOG =================
app.get("/generate-catalog", async (req, res) => {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.goto(
      "https://abs-crackers-world-26.onrender.com/catalog.html",
      { waitUntil: "networkidle2" }
    );

    await page.waitForSelector(".product-card", { timeout: 60000 });

    // wait for images
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return;
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition":
        "attachment; filename=ABS_Retail_Catalog_2026.pdf",
    });

    res.send(pdf);
  } catch (error) {
    console.error("CATALOG ERROR:", error);
    res.status(500).send(error.toString());
  } finally {
    if (browser) await browser.close();
  }
});

// ================= PRICE LIST =================
app.get("/generate-price-list", async (req, res) => {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.goto(
      "https://abs-crackers-world-26.onrender.com/pricelist.html",
      { waitUntil: "networkidle2" }
    );

    await page.waitForSelector("table", { timeout: 60000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition":
        "attachment; filename=ABS_Retail_Price_List_2026.pdf",
    });

    res.send(pdf);
  } catch (error) {
    console.error("PRICE LIST ERROR:", error);
    res.status(500).send(error.toString());
  } finally {
    if (browser) await browser.close();
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
