import { parse } from "../index/parse.js";

export function isImage(text) {
  let $ = parse(text);
  return $("div .swiper-slide").length > 0;
}
