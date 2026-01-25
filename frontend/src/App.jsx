import { useMemo, useState } from "react";
import AppStyles from "./components/AppStyles";
import MainStage from "./components/MainStage";
import Sidebar from "./components/Sidebar";
import { getHue, getLuminance, rgbToHex } from "./utils/color";

const ENDPOINT = "http://localhost:8787";

function App() {
  const [palette, setPalette] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [sortMode, setSortMode] = useState("count");

  const handleRun = async () => {
    setLoading(true);
    setSelectedColor(null);
    try {
      const res = await fetch(ENDPOINT);
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
