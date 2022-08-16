import { v4 } from "uuid";
import { got } from "got";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import chalk from "chalk";

if (!existsSync("dist")) {
  mkdirSync("dist");
}

if (!existsSync("dist/image")) {
  mkdirSync("dist/image");
}

export function getImage(url) {
  return new Promise((resolve) => {
    console.log(chalk.blueBright("Download should be waited for 3 seconds, while the server won't response the image so fast."))
    setTimeout(() => {
      const stream = got.stream(url);
      const id = v4();
      const file = createWriteStream(`./dist/image/${id}.png`);
      stream.on("data", (chunk) => {
        file.write(chunk);
        console.log(chalk.blue("Download piece"));
      });
      stream.on("end", () => {
        file.end();
        resolve(id);

        console.log(chalk.red("Download done"), chalk.green(url));
      });
    }, 30000);
  });
}
