const sortModes = ["count", "luminance", "hue"];

export default function Sidebar({
  loading,
  onRun,
  meta,
  displayedPalette,
  sortMode,
  onSortModeChange,
  selectedColor,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Chroma Lattice</h1>
        <span>Octree Quantization Engine</span>
      </div>

      <div className="control-group">
        <div className="label">Action</div>
        <button className="btn-primary" onClick={onRun} disabled={loading}>
          {loading ? "PROCESSING..." : "EXECUTE QUANTIZATION"}
        </button>
      </div>

      {meta && (
        <div className="control-group">
          <div className="label">Engine Telemetry</div>
          <div className="stats-panel">
            <div className="stat-row">
              <span>Engine</span>
              <span>Wasm/Zig</span>
            </div>
            <div className="stat-row">
              <span>Exec Time</span>
              <span className="stat-val">{meta.executionTimeMs.toFixed(3)}ms</span>
            </div>
            <div className="stat-row">
              <span>Clusters</span>
              <span className="stat-val">{meta.nodeCount}</span>
            </div>
          </div>
        </div>
      )}

      {displayedPalette.length > 0 && (
        <div className="control-group">
          <div className="label">Sort Palette</div>
          <div className="sort-options">
            {sortModes.map((mode) => (
              <button
                key={mode}
                className={`sort-btn ${sortMode === mode ? "active" : ""}`}
                onClick={() => onSortModeChange(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedColor && (
        <div className="color-detail">
          <div className="label" style={{ marginBottom: "0.5rem" }}>
            Selected Cluster
          </div>
          <div className="preview-swatch" style={{ backgroundColor: selectedColor.hex }} />
          <div className="code-block">
            <div>
              HEX: <span style={{ color: "#fff" }}>{selectedColor.hex}</span>
            </div>
            <div>
              RGB: {selectedColor.r}, {selectedColor.g}, {selectedColor.b}
            </div>
            <div>
              Count: <span style={{ color: "#fff" }}>{selectedColor.pixelCount}</span> px
            </div>
            <div>Share: {selectedColor.percentage}%</div>
          </div>
        </div>
      )}
    </aside>
  );
}
