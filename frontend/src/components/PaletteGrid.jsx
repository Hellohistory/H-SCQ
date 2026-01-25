export default function PaletteGrid({ displayedPalette, selectedColor, onSelectColor }) {
  return (
    <div className="palette-grid">
      {displayedPalette.map((item, idx) => {
        const size = 30 + Math.sqrt(item.weight) * 60;

        return (
          <div
            key={`${item.hex}-${idx}`}
            className={`color-node ${selectedColor === item ? "selected" : ""}`}
            onClick={() => onSelectColor(item)}
            style={{
              backgroundColor: item.hex,
              width: `${size}px`,
              height: `${size}px`,
              flexGrow: item.weight > 0.5 ? 2 : 1,
            }}
            title={`Count: ${item.pixelCount}`}
          />
        );
      })}
    </div>
  );
}
