const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/generate-catalog", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto("http://localhost:8080/catalog.html", {
      waitUntil: "domcontentloaded",
    });

    // wait for products
    await page.waitForSelector(".product-card", { timeout: 60000 });

    // wait for all images
    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete) return;
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=ABS_Retail_Catalog_2026.pdf",
    });

    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).send("PDF generation failed");
  }
});

app.get("/generate-price-list", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto("http://localhost:8080/pricelist.html", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("table", { timeout: 60000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition":
        "attachment; filename=ABS_Retail_Price_List_2026.pdf",
    });

    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).send("Price list generation failed");
  }
});

app.listen(3001, () => {
  console.log("Catalog PDF service running on port 3001");
});
