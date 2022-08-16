import cookie from "./cookie.js";
import got from "got";
import { parse, get_links } from "./index/parse.js";
import prettier from "prettier";
import { isFile } from "./document/check.js";
import { load } from "./document/load.js";
import chalk from "chalk";
import { isVideo } from "./video/check.js";
import { get_m3u8 } from "./video/download_m3u8.js";

const { format } = prettier;

export async function get_link(location) {
  console.log(chalk.red("Downloading text html "), chalk.green(location));
  const result = await got(location, {
    headers: {
      // cookie: cookie,
    },
  }).text();

  console.log(
    chalk.blue("Downloaded text html"),
    chalk.cyan("length: ", result.length)
  );
  return result;
}

// let result = await get_link(
//   "https://mp.bookln.cn/book.htm?_appbiz=bookdetail&bookid=204032&id=204032&sign=b04bd0#27959389"
// );
// import("fs").then((fs) => {
//   fs.writeFileSync("index.html", format(result, { parser: "html" }));
// });
// let res = get_links(parse(result));
async function get_type(order) {
  let type = "";
  let x = res[order];
  let path =
    new URL(
      "https://mp.bookln.cn/book.htm?_appbiz=bookdetail&bookid=204032&id=204032&sign=b04bd0#27959389"
    ).origin + x.path;
  // console.log(x.name, x.path, isFile(await get_link(path)));
  let ctn = await get_link(path);
  // if (isFile(ctn)) {
  //   console.log(await load(path));
  // } else
  if (isVideo(ctn)) {
    console.log(chalk.blue("It is a video with m3u8", x.name));
    get_m3u8(ctn);
  }
  if (res.length > order) {
    get_type(order + 1);
  } else return;
}

// get_type(0);
