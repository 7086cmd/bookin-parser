import got from "got";
import { isAudio } from "../audio/check.js";
import { isFile } from "../document/check.js";
import { isImage } from "../image/check.js";
import { isResource } from "../resource/check.js";
import { isVideo } from "../video/check.js";

export function checkFile(file) {
  if (isAudio(file)) {
    return "audio";
  }
  if (isFile(file)) {
    return "document";
  }
  if (isImage(file)) {
    return "image";
  }
  if (isResource(file)) {
    return "resource";
  }
  if (isVideo(file)) {
    return "video";
  }
  return "unknown";
}

export async function checkUrl(url) {
  const text = await got(url + "&_iframeAdapter=1&_pcAdapter=1").text();
  return checkFile(text);
}
