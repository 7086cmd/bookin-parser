import got from "got";
import chalk from "chalk";
import { load } from "cheerio";
import { resolve as path_resolve } from "path";
import { existsSync, mkdirSync, createWriteStream, rmdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { PDFDocument } from 'pdf-lib'
import imageSize from "image-size"
import { promisify } from "util";
import { trim } from "lodash-es";

export async function getImageList(url) {
  const text = await got(url).text();
  const $ = load(text);
  const elements = $("div .swiper-slide").get();
  return elements.map((x) => x.children[1].children[1].attribs["data-src"]);
  // console.log(elements.map((x) => x.children[1].children[1].attribs["data-src"]))
}

export function downloadImage(urls, order, filename) {
  return new Promise((resolve, reject) => {
    const folder = "dist/image/" + trim(filename);
    console.log(folder)
    if (!existsSync("dist")) {
      mkdirSync("dist");
    }
    if (!existsSync("dist/image")) {
      mkdirSync("dist/image");
    }
    if (!existsSync(folder)) {
      mkdirSync(folder);
    } else if (order === 0) {
      rmdirSync(folder, { recursive: true });
      mkdirSync(folder);
    }
    const file = createWriteStream(path_resolve(folder, order + ".jpg"));
    const stream = got.stream(urls[order]);
    stream
      .on("data", (chunk) => {
        file.write(chunk);
      })
      .on("end", () => {
        file.end();
        console.log(chalk.blue("We have downloaded the image file"));
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

export async function mergeImage(filename) {
  const pdfDoc = await PDFDocument.create();
  filename = trim(filename);
  const pdf = path_resolve("dist", "image", filename + ".pdf");
  const dir = readdirSync("dist/image/" + filename);
  console.log(chalk.red("Creating pdf file:"), chalk.green(pdf));
  for (let i = 0; i < dir.length; i++) {
    const file = path_resolve("dist", "image", filename, dir[i]);
    const img = readFileSync(file);
    const { width, height } = imageSize(img);
    const jpgImage = await pdfDoc.embedJpg(img);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const bytes = await pdfDoc.save();

  writeFileSync(pdf, bytes);

  console.log(chalk.blue("The pdf file was created."));
}