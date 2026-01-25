import { useMemo, useState } from "react";

const endpoint = "http://localhost:8787";

const appStyles = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 10% 20%, #f6f1ea 0%, #f1efe9 35%, #efe9df 100%)",
  color: "#201c16",
};

function App() {
  const [palette, setPalette] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    if (!palette.length) return null;
    const maxCount = Math.max(...palette.map((item) => item.pixelCount));
    return { maxCount };
  }, [palette]);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setPalette(json.data);
      setMeta(json.meta);
    } catch (err) {
      console.error(err);
      alert("Error connecting to Edge Worker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={appStyles}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap");

        .app-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 4rem;
          font-family: "Space Grotesk", "Segoe UI", sans-serif;
        }

        .hero {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          align-items: center;
          padding: 2rem;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 240, 0.6));
          box-shadow: 0 18px 40px rgba(32, 28, 22, 0.12);
        }

        .hero h1 {
          font-size: clamp(2.2rem, 3vw, 3.2rem);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .hero p {
          margin: 0.4rem 0 0;
          color: #5b5147;
          font-size: 1rem;
        }

        .cta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .cta button {
          border: none;
          padding: 0.9rem 1.6rem;
          font-weight: 700;
          font-size: 1rem;
          border-radius: 999px;
          background: #201c16;
          color: #f8f4ed;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          box-shadow: 0 10px 20px rgba(32, 28, 22, 0.2);
        }

        .cta button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .cta button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 26px rgba(32, 28, 22, 0.24);
        }

        .meta {
          margin-top: 1rem;
          padding: 1.2rem 1.4rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.75);
          color: #2d2620;
          font-size: 0.95rem;
          display: grid;
          gap: 0.3rem;
        }

        .grid {
          margin-top: 2.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 0.6rem;
        }

        .swatch {
          height: 70px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 0.5rem;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          animation: float-in 0.6s ease both;
        }

        .swatch span {
          background: rgba(0, 0, 0, 0.35);
          padding: 0.15rem 0.4rem;
          border-radius: 999px;
        }

        @keyframes float-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="app-shell">
        <section className="hero">
          <div>
            <h1>Chroma-Lattice</h1>
            <p>Hierarchical spatial color quantization, compiled to Wasm, executed at the edge.</p>
          </div>
          <div className="cta">
            <button onClick={handleRun} disabled={loading}>
              {loading ? "Quantizing..." : "Run Octree"}
            </button>
            <div style={{ color: "#6b5f54", fontSize: "0.9rem" }}>
              Endpoint: {endpoint}
            </div>
          </div>
        </section>

        {meta && (
          <div className="meta">
            <div>
              <strong>Engine:</strong> {meta.engine}
            </div>
            <div>
              <strong>Time:</strong> {meta.executionTimeMs.toFixed(3)} ms
            </div>
            <div>
              <strong>Clusters:</strong> {meta.nodeCount}
            </div>
          </div>
        )}

        <section className="grid">
          {palette.map((item, idx) => (
            <div
              key={`${item.r}-${item.g}-${item.b}-${idx}`}
              className="swatch"
              style={{
                backgroundColor: `rgb(${item.r}, ${item.g}, ${item.b})`,
                animationDelay: `${Math.min(idx * 20, 400)}ms`,
              }}
              title={`R:${item.r} G:${item.g} B:${item.b} | Count:${item.pixelCount}`}
            >
              <span>
                {stats && item.pixelCount === stats.maxCount ? "Dominant" : item.pixelCount}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default App;
