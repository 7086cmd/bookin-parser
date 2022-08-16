import { parse } from "../index/parse.js";

export function isAudio(text) {
  let $ = parse(text);
  return $("audio").length > 0;
}
