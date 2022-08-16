import { load } from "cheerio";
import got from "got";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { resolve as path_resolve } from "path";
import chalk from "chalk";

export async function getDocumentIframeUrl(url) {
  const text = await got(url).text();
  const src = load(text)("iframe").get()[0].attribs.src;
  // console.log(src);
  return src;
}

export async function getDocumentUrl(url, current) {
  const resp = await got(url, {
    headers: {
      referer: current,
    },
  });
  const uri = resp.redirectUrls[0];
  return uri.searchParams.get("furl");
}

export async function downloadDocument(url, filename, socket) {
  return new Promise((resolve, reject) => {
    console.log(url, filename)
    if (!existsSync("dist")) mkdirSync("dist");
    if (!existsSync("dist/document")) mkdirSync("dist/document");
    const file = createWriteStream(path_resolve("dist/document/" + filename + ".docx"));
    const stream = got.stream(url);
    stream
      .on("data", (chunk) => {
        console.log(
          chalk.blue("We received the chunk with"),
          chalk.yellow(chunk.length),
          chalk.blue("bytes")
        );
        file.write(chunk);
      })
      .on("end", () => {
        file.end();
        console.log(chalk.blue("We have downloaded the document file"));
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      })
      .on("downloadProgress", (progress) => {
        socket.emit("download-document-result", {
          status: "Continue",
          data: progress.percent,
          ord: 3,
        });
      });
  });
}
