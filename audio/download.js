import got from "got";
import { createWriteStream, mkdirSync, rmdirSync, existsSync } from "fs";
import { load } from "cheerio";
import chalk from "chalk";
import { resolve as path_resolve } from "path";

const refix = "&_iframeAdapter=1&_pcAdapter=1";

export async function getAudioLocation(loc) {
  // try {
    console.log(
      chalk.red(
        "We are getting the audio link from page",
        chalk.green(loc + refix)
      )
    );
    const text = await got(loc + refix).text();
    const src = load(text)("audio").get()[0].attribs.src;
    console.log(chalk.red("We are got the audio link:", chalk.green(src)));
    return {
      status: "OK",
      data: src,
    };
  // } catch (err) {
  //   return {
  //     status: "Error",
  //     err,
  //   };
  // }
}

export function downloadAudio(url, filename, socket) {
  return new Promise((resolve, reject) => {
    const folder = "dist/audio/" + filename + ".mp3";
    if (!existsSync("dist")) {
      mkdirSync("dist");
    }
    if (!existsSync("dist/audio")) {
      mkdirSync("dist/audio");
    }
    const file = createWriteStream(path_resolve(folder));
    const stream = got.stream(url);
    stream.on("data", (chunk) => {
      console.log(
        chalk.blue("We received the chunk with"),
        chalk.yellow(chunk.length),
        chalk.blue("bytes")
      );
      file.write(chunk);
    });
    stream.on("downloadProgress", (progress) => {
      socket.emit("download-audio-result", {
        status: "Continue",
        data: progress.percent,
        ord: 2,
      });
    });
    stream.on("end", () => {
      file.end();
      console.log(chalk.blue("We have downloaded the audio file"));
      resolve();
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}
