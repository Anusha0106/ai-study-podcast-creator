const { Jimp } = require('jimp');
const path = require('path');

async function processImage() {
  const inputPath = path.join(__dirname, 'assets', 'images', 'podcast-hero-original.jpg');
  const outRosePath = path.join(__dirname, 'assets', 'images', 'podcast-hero-recoloured.png');
  const outRoseGoldPath = path.join(__dirname, 'assets', 'images', 'podcast-hero-rosegold.png');
  const outTransPath = path.join(__dirname, 'assets', 'images', 'podcast-hero-transparent.png');

  console.log('Reading image:', inputPath);
  const image = await Jimp.read(inputPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // Clone for different variants
  const roseImg = image.clone();
  const roseGoldImg = image.clone();
  const transImg = image.clone();

  // Helper RGB to HSL
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s, l];
  }

  // Helper HSL to RGB
  function hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  // Recolour scans
  // Rose target hue: #EE6983 is ~348 deg, sat: 0.79, light: 0.67
  // Rose gold target hue: #DA8393 is ~349 deg, sat: 0.54, light: 0.69
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = image.bitmap.data[idx];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const [h, s, l] = rgbToHsl(r, g, b);

      // Detect cyan/blue circles (Hue ~ 175 to 225, Saturation > 0.3)
      const isBlueCircle = (h >= 170 && h <= 235 && s >= 0.25 && l >= 0.2 && l <= 0.88) ||
                           (b > 160 && b > r + 40 && g > 110 && r < 140);

      if (isBlueCircle) {
        // Map to Rose #EE6983 with matched lightness
        const [rr, rg, rb] = hslToRgb(348, 0.82, Math.max(0.4, Math.min(0.78, l)));
        roseImg.bitmap.data[idx] = rr;
        roseImg.bitmap.data[idx + 1] = rg;
        roseImg.bitmap.data[idx + 2] = rb;

        // Map to Rose-Gold #DA8393
        const [rgr, rgg, rgbVal] = hslToRgb(349, 0.56, Math.max(0.4, Math.min(0.78, l)));
        roseGoldImg.bitmap.data[idx] = rgr;
        roseGoldImg.bitmap.data[idx + 1] = rgg;
        roseGoldImg.bitmap.data[idx + 2] = rgbVal;
      }

      // For transparent version: if pixel is near-white background (r > 240, g > 240, b > 240), make transparent
      if (r > 242 && g > 242 && b > 242) {
        transImg.bitmap.data[idx + 3] = 0;
      }
      if (isBlueCircle) {
        // On transparent img, also recolor the circles to rose
        const [trr, trg, trb] = hslToRgb(348, 0.82, l);
        transImg.bitmap.data[idx] = trr;
        transImg.bitmap.data[idx + 1] = trg;
        transImg.bitmap.data[idx + 2] = trb;
      }
    }
  }

  await roseImg.write(outRosePath);
  await roseGoldImg.write(outRoseGoldPath);
  await transImg.write(outTransPath);
  console.log('Recolored images created successfully!');
}

processImage().catch(console.error);
