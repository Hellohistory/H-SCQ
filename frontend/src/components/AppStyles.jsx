export default function AppStyles() {
  return (
    <style>{`
      :root {
        --bg-color: #0f0f11;
        --panel-bg: #18181b;
        --text-primary: #e4e4e7;
        --text-secondary: #a1a1aa;
        --accent: #3b82f6;
        --border: #27272a;
        --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      }

      body {
        margin: 0;
        background-color: var(--bg-color);
        color: var(--text-primary);
        font-family: var(--font-sans);
        -webkit-font-smoothing: antialiased;
      }

      .layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        height: 100vh;
        overflow: hidden;
      }

      .sidebar {
        background: var(--panel-bg);
        border-right: 1px solid var(--border);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        overflow-y: auto;
      }

      .brand h1 {
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        margin: 0;
        color: var(--text-primary);
      }

      .brand span {
        color: var(--text-secondary);
        font-size: 0.85rem;
        display: block;
        margin-top: 0.25rem;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        font-weight: 600;
      }

      .btn-primary {
        background: var(--text-primary);
        color: var(--bg-color);
        border: none;
        padding: 0.75rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .stats-panel {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 1rem;
        font-family: var(--font-mono);
        font-size: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border: 1px solid var(--border);
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
      }

      .stat-val {
        color: var(--accent);
      }

      .sort-options {
        display: flex;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem;
        border-radius: 6px;
      }

      .sort-btn {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-secondary);
        padding: 0.4rem;
        font-size: 0.75rem;
        cursor: pointer;
        border-radius: 4px;
      }

      .sort-btn.active {
        background: var(--border);
        color: var(--text-primary);
      }

      .color-detail {
        margin-top: auto;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
      }

      .preview-swatch {
        height: 60px;
        border-radius: 6px;
        margin-bottom: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .code-block {
        font-family: var(--font-mono);
        font-size: 0.85rem;
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .main-stage {
        padding: 2rem;
        overflow-y: auto;
        display: flex;
        align-items: flex-start;
        justify-content: center;
      }

      .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .palette-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        width: 100%;
        max-width: 1200px;
      }

      .color-node {
        position: relative;
        cursor: pointer;
        transition: transform 0.2s, z-index 0s;
        border-radius: 2px;
      }

      .color-node:hover {
        transform: scale(1.1);
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }

      .color-node.selected {
        outline: 2px solid white;
        z-index: 5;
      }

      @media (max-width: 768px) {
        .layout {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }

        .sidebar {
          padding: 1rem;
          border-right: none;
          border-bottom: 1px solid var(--border);
        }

        .color-detail {
          display: none;
        }
      }
    `}</style>
  );
}
