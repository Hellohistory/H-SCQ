import PaletteGrid from "./PaletteGrid";

export default function MainStage({ displayedPalette, selectedColor, onSelectColor }) {
  return (
    <main className="main-stage">
      {!displayedPalette.length ? (
        <div className="empty-state">Waiting for quantization data... click Execute to start.</div>
      ) : (
        <PaletteGrid
          displayedPalette={displayedPalette}
          selectedColor={selectedColor}
          onSelectColor={onSelectColor}
        />
      )}
    </main>
  );
}
