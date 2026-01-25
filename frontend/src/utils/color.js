export function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function getLuminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getHue(r, g, b) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  let h = 0;

  if (max === min) {
    h = 0;
  } else if (max === rN) {
    h = (gN - bN) / (max - min);
  } else if (max === gN) {
    h = 2 + (bN - rN) / (max - min);
  } else {
    h = 4 + (rN - gN) / (max - min);
  }

  h = h * 60;
  if (h < 0) h += 360;
  return h;
}
