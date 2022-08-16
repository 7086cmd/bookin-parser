import { parse } from "../index/parse.js";

export function isVideo(text) {
    let $ = parse(text);
    return $("video").length > 0;
}