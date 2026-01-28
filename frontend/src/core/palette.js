import { getHue, getLuminance, rgbToHex } from "../utils/color";

export function processPaletteData(palette) {
    if (!palette || palette.length === 0) return [];

    const totalPixels = palette.reduce((acc, curr) => acc + curr.pixelCount, 0);
    const maxCount = Math.max(...palette.map((p) => p.pixelCount));

    return palette.map((item) => ({
        ...item,
        hex: rgbToHex(item.r, item.g, item.b),
        luminance: getLuminance(item.r, item.g, item.b),
        percentage: ((item.pixelCount / totalPixels) * 100).toFixed(2),
        weight: item.pixelCount / maxCount,
    }));
}

export function sortPalette(processedPalette, sortMode) {
    const sorted = [...processedPalette];

    if (sortMode === "luminance") {
        sorted.sort((a, b) => b.luminance - a.luminance);
    } else if (sortMode === "hue") {
        sorted.sort((a, b) => getHue(a.r, a.g, a.b) - getHue(b.r, b.g, b.b));
    } else {
        sorted.sort((a, b) => b.pixelCount - a.pixelCount);
    }

    return sorted;
}