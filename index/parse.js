import { load } from "cheerio";
import pkg from "iconv-lite";
import prettier from "prettier";

const { format } = prettier;
const { decode } = pkg;

export function parse(html) {
  let source = format(html, { parser: "html" });
  const $ = load(decode(Buffer.from(source), "utf8"));
  return $
}

export function get_links($) {
  let list = $("div .section-wrapper")
    .get()
    .map(val => ({
        name: val.children[1].children[1].children[0].data,
        path: val.attributes[2].value,
    }));
  return list;
}