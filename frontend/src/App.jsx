import { useMemo, useState } from "react";
import AppStyles from "./components/AppStyles";
import MainStage from "./components/MainStage";
import Sidebar from "./components/Sidebar";
import { getHue, getLuminance, rgbToHex } from "./utils/color";

const ENDPOINT = "https://hscq.nestools.net";

function App() {
  const [palette, setPalette] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [sortMode, setSortMode] = useState("count");
  const [imageBytes, setImageBytes] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  const decodeImageToBytes = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bytes = new Uint8Array(imageData.data.buffer.slice(0));
        URL.revokeObjectURL(url);
        resolve({
          bytes,
          width: canvas.width,
          height: canvas.height,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to decode image"));
      };
      img.src = url;
    });

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setSelectedColor(null);
    try {
      const { bytes, width, height } = await decodeImageToBytes(file);
      setImageBytes(bytes);
      setImageInfo({
        name: file.name,
        width,
        height,
        byteLength: bytes.length,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to read the selected image.");
      setImageBytes(null);
      setImageInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!imageBytes || !imageInfo) {
      alert("Please select an image before running quantization.");
      return;
    }
    setLoading(true);
    setSelectedColor(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Image-Width": String(imageInfo.width),
          "X-Image-Height": String(imageInfo.height),
          "X-Image-Name": imageInfo.name,
        },
        body: imageBytes,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setPalette(json.data);
      setMeta(json.meta);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the quantization engine.");
    } finally {
      setLoading(false);
    }
  };

  const displayedPalette = useMemo(() => {
    if (!palette.length) return [];

    const sorted = [...palette];

    if (sortMode === "luminance") {
      sorted.sort((a, b) => getLuminance(b.r, b.g, b.b) - getLuminance(a.r, a.g, a.b));
    } else if (sortMode === "hue") {
      sorted.sort((a, b) => getHue(a.r, a.g, a.b) - getHue(b.r, b.g, b.b));
    } else {
      sorted.sort((a, b) => b.pixelCount - a.pixelCount);
    }

    const totalPixels = sorted.reduce((acc, curr) => acc + curr.pixelCount, 0);
    const maxCount = Math.max(...sorted.map((p) => p.pixelCount));

    return sorted.map((item) => ({
      ...item,
      hex: rgbToHex(item.r, item.g, item.b),
      luminance: getLuminance(item.r, item.g, item.b),
      percentage: ((item.pixelCount / totalPixels) * 100).toFixed(2),
      weight: item.pixelCount / maxCount,
    }));
  }, [palette, sortMode]);

  return (
    <div className="layout">
      <AppStyles />
      <Sidebar
        loading={loading}
        onRun={handleRun}
        meta={meta}
        displayedPalette={displayedPalette}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        selectedColor={selectedColor}
        onImageChange={handleImageChange}
        imageInfo={imageInfo}
      />
      <MainStage
        displayedPalette={displayedPalette}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />
    </div>
  );
}

export default App;
