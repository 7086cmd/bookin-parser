import { load } from "cheerio";
import { v4 } from "uuid";
import { mkdirSync, existsSync, writeFileSync, createWriteStream } from "fs";
import got from "got";
import chalk from "chalk";
import { join } from "path";

export async function get_m3u8(html) {
  const $ = load(html);
  let elements = $("div #data_content").get();
  async function each_get_file(ord) {
    console.log(elements[ord].children[0].data);
    await get_m3u8_file(elements[ord].children[0].data);

    if (ord >= elements.length - 1) {
      return;
    } else {
      await each_get_file(ord + 1);
    }
  }
  await each_get_file(0);
}

if (!existsSync("dist")) {
  mkdirSync("dist");
}

if (!existsSync("dist/video")) {
  mkdirSync("dist/video");
}

export async function get_m3u8_file(url) {
  console.log(chalk.red("Getting m3u8 file..."));
  const id = v4();
  const folder = "dist/video/" + id;
  mkdirSync(folder);
  const filename = new URL(url).pathname.split("/").reverse()[0];
  const filetext = await got(url).text();
  writeFileSync(folder + "/" + filename, filetext);

  console.log(chalk.blue("Got m3u8 file...\nparsing..."));

  const pieces = await parse_m3u8_file(filetext);

  const urls = [],
    locs = [];
  for (let i = 0; i < pieces.length; i++) {
    const vurl = pieces[i];
    const location = join(folder, vurl);
    urls.push(new URL(url).origin + vurl);
    locs.push(location);
  }
  // console.log(urls, locs);
  await get_all_ts(locs, urls);
}
export async function parse_m3u8_file(content) {
  const pieces = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#")) {
      continue;
    } else {
      if (lines[i].length > 0) {
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

export function get_ts_file(loc, url) {
  return new Promise((resolve) => {
    console.log(
      chalk.red("Getting ts file...", chalk.green(url), chalk.yellow("to", loc))
    );
    const file = createWriteStream(loc);

    const stream = got.stream(url);

    stream.on("data", (chunk) => {
      file.write(chunk);
    });
    stream.on("end", () => {
      file.end();
      console.log(chalk.blue("Got ts file..."), chalk.green(url));
      resolve();
    });
  });
}

export async function get_all_ts(locs, urls) {
  return Promise.all(locs.map((loc, i) => get_ts_file(loc, urls[i])));
}
