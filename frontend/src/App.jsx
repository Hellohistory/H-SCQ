import AppStyles from "./components/AppStyles";
import MainStage from "./components/MainStage";
import Sidebar from "./components/Sidebar";
import { useQuantizer } from "./hooks/useQuantizer";

function App() {
  const { state, actions } = useQuantizer();

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    actions.processImageFile(file);
  };

  return (
      <div className="layout">
        <AppStyles />

        {/* 错误提示条 - 简单的 UI 反馈 */}
        {state.error && (
            <div className="error-toast" onClick={actions.clearError}>
              <span>Error: {state.error}</span>
              <button className="close-btn">×</button>
            </div>
        )}

        <Sidebar
            loading={state.loading}
            onRun={actions.runQuantization}
            meta={state.meta}
            displayedPalette={state.displayedPalette}
            sortMode={state.sortMode}
            onSortModeChange={actions.setSortMode}
            selectedColor={state.selectedColor}
            onImageChange={handleImageChange}
            imageInfo={state.imageInfo}
        />

        <MainStage
            displayedPalette={state.displayedPalette}
            selectedColor={state.selectedColor}
            onSelectColor={actions.setSelectedColor}
        />
      </div>
  );
}

export default App;