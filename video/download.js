import got from "got";
import chalk from "chalk";
import { load } from "cheerio";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  createWriteStream,
  rmdirSync,
  readdirSync,
  copyFileSync,
} from "fs";
import { join, resolve as path_resolve } from "path";
import { execSync } from "child_process";

export async function getM3u8File(url) {
  const $ = load(await got(url).text());
  let elements = $("div #data_content").get();
  return elements[0].children[0].data;
}

export async function downloadM3u8File(url, filename) {
  const text = await got(url).text();
  if (!existsSync("dist")) {
    mkdirSync("dist");
  }
  if (!existsSync("dist/video")) {
    mkdirSync("dist/video");
  }
  const folder = "dist/video/" + filename;
  if (!existsSync(folder)) {
    mkdirSync(folder);
  } else {
    rmdirSync(folder, { recursive: true });
    mkdirSync(folder);
  }
  writeFileSync(
    path_resolve(
      "dist",
      "video",
      filename,
      new URL(url).pathname.split("/").reverse()[0]
    ),
    text
      .trim()
      .split("\n")
      .map((line) => {
        if (line.startsWith("/")) {
          const x = line.split("").reverse();
          x.pop();
          return x.reverse().join("");
        } else return line;
      })
      .join("\n")
  );
  return text;
}

export async function parseM3u8File(content) {
  const pieces = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#")) {
      continue;
    } else {
      if (lines[i].length > 0) {
        if (!lines[i].startsWith("/")) lines[i] = "/" + lines[i];
        pieces.push(lines[i]);
        console.log(chalk.blue("Recieved piece"), chalk.green(lines[i]));
      }
    }
  }
  console.log(
    chalk.blue("totally got"),
    chalk.green(pieces.length),
    chalk.blue("pieces")
  );
  return pieces;
}

export function downloadTsFile(url, filename) {
  return new Promise((resolve, reject) => {
    console.log(
      chalk.red("We are downloading the video piece", chalk.green(url))
    );
    if (!existsSync("dist")) {
      mkdirSync("dist");
    }
    if (!existsSync("dist/video")) {
      mkdirSync("dist/video");
    }
    const folder = "dist/video/" + filename;
    if (!existsSync(folder)) {
      mkdirSync(folder);
    }
    const file = createWriteStream(
      path_resolve(
        "dist",
        "video",
        filename,
        new URL(url).pathname.split("/").reverse()[0]
      )
    );
    const stream = got.stream(url);
    stream.on("data", (chunk) => {
      file.write(chunk);
    });
    stream.on("end", () => {
      file.end();
      console.log(
        chalk.blue("We have downloaded this piece. chunk size:"),
        chalk.yellow(file.bytesWritten)
      );
      resolve();
    });
    stream.on("error", (err) => {
      reject(err)
    })
  });
}

export function mergeM3u8File(filename) {
  return new Promise((resolve) => {
    console.log(chalk.red("We are merging the video file"));
    const loc = path_resolve("dist", "video", filename);
    // execSync(`ffmpeg -i concat -safe 0 -i list.txt -c copy output.ts`);
    readdirSync(loc).forEach((file) => {
      if (file.endsWith(".m3u8")) {
        execSync(
          `cd ${loc} && ffmpeg.exe -allowed_extensions ALL -protocol_whitelist "file,http,crypto,tcp" -i ./${file} -c copy output.mp4`
        );
        copyFileSync(path_resolve(loc, "output.mp4"), loc + ".mp4");
        resolve();
      }
    });
  });
}
