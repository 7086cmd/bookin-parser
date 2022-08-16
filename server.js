import Koa from "koa";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFileSync } from "fs";
import chalk from "chalk";
import { get_link } from "./downloader.js";
import { get_links, parse } from "./index/parse.js";
import { checkUrl } from "./index/check.js";
import {
  downloadM3u8File,
  getM3u8File,
  parseM3u8File,
  downloadTsFile,
  mergeM3u8File,
} from "./video/download.js";
import { resolve } from "path";
import { getAudioLocation, downloadAudio } from "./audio/download.js";
import {
  downloadDocument,
  getDocumentIframeUrl,
  getDocumentUrl,
} from "./document/download.js";
import { downloadImage, getImageList, mergeImage } from "./image/download.js";

const app = new Koa();
const httpServer = createServer(app.callback());
const io = new Server(httpServer, {
  /* options */
});

app.use(async (ctx) => {
  ctx.type = "html";
  ctx.body = readFileSync("./pages/index.html");
});

io.on("connection", (socket) => {
  // ...
  socket.on("document", (link) => {
    console.log(
      chalk.red("Recieved link:"),
      chalk.green(link),
      chalk.red("Downloading...")
    );
    const res_template = {
      name: "", // resource name
      path: "", // link path
      resourceType: "", // 'video' | 'document' | 'image' | 'audio' | 'file',
      date: "", // date
      downloaded: false, // downloaded content
      parsed: false, // parsed content
    };
    get_link(link).then((result) => {
      const document = result;
      const response = get_links(parse(document));
      socket.emit("document-result", {
        status: "OK",
        data: response,
      });
    });
  });
  socket.on("checkurl", (url) => {
    checkUrl(url.url).then((result) => {
      socket.emit("checkurl-result", {
        status: "OK",
        data: {
          result,
          order: url.index,
        },
      });
    });
  });
  socket.on("download-image", (url) => {
    getImageList(url.url).then((list) => {
      socket.emit("download-image-result", {
        status: "Continue",
        fullist: list.map((x) => {
          if (x.startsWith("http")) {
            return x;
          } else {
            return new URL(url).origin + x;
          }
        }),
        data: "已经获取图片列表",
        ord: 1,
      });
    });
  });
  socket.on("download-image-piece", (url) => {
    console.log(chalk.red("Downloading image piece:"), chalk.green(url.fullist[url.order]))
    downloadImage(url.fullist, url.order, url.filename).then(() => {
      socket.emit("download-image-piece-result", {
        status: url.fullist[url.order + 1] ? "Continue" : "OK",
        data: {
          order: url.order,
          fullist: url.fullist,
          filename: url.filename,
        },
      });
      if (!url.fullist[url.order + 1]) {
        mergeImage(url.filename).then(() => {
          socket.emit("download-image-result", {
            status: "OK",
            data: "下载完成",
            ord: 5,
          });
        });
      }
    });
  });
  socket.on("download-document", (url) => {
    getDocumentIframeUrl(url.url).then((uri) => {
      socket.emit("download-document-result", {
        status: "Continue",
        data: "已经得到嵌入框架位置",
        ord: 1,
      });
      const url_then = new URL(url.url).origin + uri;
      getDocumentUrl(url_then, url.url).then((docx) => {
        socket.emit("download-document-result", {
          status: "Continue",
          data: "已经得到文件位置，开始下载",
          ord: 2,
        });

        downloadDocument(docx, url.name, socket).then((result) => {
          socket.emit("download-document-result", {
            status: "OK",
            data: "下载完成",
            ord: 4,
          });
        });
      });
    });
  });
  socket.on("download-audio", (url) => {
    getAudioLocation(url.url).then((result) => {
      socket.emit("download-audio-result", {
        status: "Continue",
        data: "已经获取音频链接",
        ord: 1,
      });
      downloadAudio(result.data, url.name, socket).then(() => {
        socket.emit("download-audio-result", {
          status: "OK",
          data: "下载已完成",
          ord: 3,
        });
      });
    });
    // .catch((err) => {
    //   socket.emit("download-audio-result", {
    //     status: "Error",
    //     data: err,
    //     ord: -1,
    //   });
    // });
  });
  socket.on("download-video-piece", (url) => {
    downloadTsFile(url.fullist[url.order], url.filename).then(() => {
      socket.emit("download-video-piece-result", {
        status: url.fullist[url.order + 1] ? "Continue" : "OK",
        data: {
          order: url.order,
          fullist: url.fullist,
          filename: url.filename,
        },
      });
      if (!url.fullist[url.order + 1]) {
        mergeM3u8File(url.filename).then(() => {
          socket.emit("download-video-result", {
            status: "OK",
            data: "下载完成",
            ord: 5,
          });
        });
      }
    });
  });
  socket.on("download-video", (url) => {
    const uri = url.url;
    const filename = url.name;
    getM3u8File(uri).then((res) => {
      socket.emit("download-video-result", {
        status: "Continue",
        data: "已经获得视频列表地址",
        ord: 0,
      });
      console.log(
        chalk.red("We revieved the video playlist"),
        chalk.green(res)
      );
      downloadM3u8File(res, filename).then((text) => {
        socket.emit("download-video-result", {
          status: "Continue",
          data: "已经下载视频列表",
          ord: 1,
        });
        parseM3u8File(text).then((list) => {
          socket.emit("download-video-result", {
            status: "Continue",
            data: "已经下载视频列表",
            ord: 2,
            fullist: list.map((x) => {
              return new URL(res).origin + x;
            }),
          });
        }); // 此时开始显示进度条
      });
    });
  });
});

httpServer.listen(3000);
