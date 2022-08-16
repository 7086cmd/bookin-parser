import chalk from "chalk";
import Puppeteer from "puppeteer";
import { getImage } from "./get_image.js";

async function get_all_images(url) {
  let imgs = [];
  const browser = await Puppeteer.launch({
    headless: false,
  });

  //   await page.setRequestInterception(true);
  const page = await browser.newPage();
  page.on("request", async (request) => {
    const url = request.url();
    if (url.includes("/img?")) {
      console.log(chalk.red("Downloading image: ") + chalk.green(url));
      imgs.push(url);
    }
  });
  await page.goto(url);
  return imgs;
}

export async function load(url) {
  const browser = await Puppeteer.launch({
    // headless: false,
  });

  //   await page.setRequestInterception(true);
  const page = await browser.newPage();

  let imgs = [];

  page.on("request", async (request) => {
    // console.log(request.url());
    if (request.url().endsWith(".docx")) {
      imgs.push(get_all_images(request.url()));
    }
  });
  await page.goto(url);
  return imgs;
  //   await browser.close();
}
