const sharp = require("sharp");
const fs = require("fs");

const svg = fs.readFileSync("public/icons/icon-master.svg");

async function gen(size, name, maskable) {
  let img;
  if (maskable) {
    const pad = Math.round(size * 0.1);
    const bg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#0a6e8a"/></svg>`
    );
    const inner = await sharp(svg).resize(size - pad * 2, size - pad * 2).png().toBuffer();
    img = sharp(bg).composite([{ input: inner, top: pad, left: pad }]);
  } else {
    img = sharp(svg).resize(size, size);
  }
  await img.png().toFile(`public/icons/${name}`);
  console.log("generated", name);
}

(async () => {
  await gen(192, "icon-192.png", false);
  await gen(512, "icon-512.png", false);
  await gen(512, "icon-maskable-512.png", true);
})();
