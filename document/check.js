import { parse } from "../index/parse.js";

export function isFile(text) {
  let $ = parse(text);
  return $("iframe").length > 0;
}
