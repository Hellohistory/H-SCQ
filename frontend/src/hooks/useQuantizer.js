import { useState, useMemo } from "react";
import { processPaletteData, sortPalette } from "../core/palette";

const WASM_URL = "/chroma_lattice.wasm";
let wasmInstancePromise = null;

async function loadWasmInstance() {
  if (wasmInstancePromise) return wasmInstancePromise;

  wasmInstancePromise = (async () => {
    const response = await fetch(WASM_URL);
    if (!response.ok) {
      throw new Error(`Failed to load wasm: HTTP ${response.status}`);
    }

    if ("instantiateStreaming" in WebAssembly) {
      try {
        const responseClone = response.clone();
        const { instance } = await WebAssembly.instantiateStreaming(responseClone, {});
        return instance;
      } catch (err) {
        const buffer = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buffer, {});
        return instance;
      }
    }

    const buffer = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(buffer, {});
    return instance;
  })();

  return wasmInstancePromise;
}

export function useQuantizer() {
  const [state, setState] = useState({
    palette: [],
    meta: null,
    loading: false,
    error: null,
    imageBytes: null,
    imageInfo: null,
    selectedColor: null,
    sortMode: "count",
  });

  const displayedPalette = useMemo(() => {
    const processed = processPaletteData(state.palette);
    return sortPalette(processed, state.sortMode);
  }, [state.palette, state.sortMode]);

  const processImageFile = async (file) => {
    if (!file) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { bytes, width, height } = await decodeImageToBytes(file);
      setState((prev) => ({
        ...prev,
        loading: false,
        imageBytes: bytes,
        selectedColor: null,
        imageInfo: {
          name: file.name,
          width,
          height,
          byteLength: bytes.length,
        },
      }));
    } catch (err) {
      console.error("Image Decode Error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Unable to decode the image file. Please verify the format.",
        imageBytes: null,
        imageInfo: null,
      }));
    }
  };

  const runQuantization = async () => {
    const { imageBytes, imageInfo } = state;
    if (!imageBytes || !imageInfo) {
      setState((prev) => ({ ...prev, error: "Please choose an image first." }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, selectedColor: null }));

    try {
      const instance = await loadWasmInstance();
      const { run_octree, get_result_pointer, alloc_image_buffer, memory } = instance.exports;

      const imagePtr = alloc_image_buffer(imageBytes.length);
      if (!imagePtr) {
        throw new Error("Image is too large for the wasm buffer.");
      }

      const wasmBytes = new Uint8Array(memory.buffer, imagePtr, imageBytes.length);
      wasmBytes.set(imageBytes);

      const startTime = performance.now();
      const count = run_octree(imagePtr, imageBytes.length);
      const endTime = performance.now();

      const ptr = get_result_pointer();
      const structSize = 8;
      const dataView = new DataView(memory.buffer, ptr, count * structSize);

      const palette = [];
      for (let i = 0; i < count; i += 1) {
        const offset = i * structSize;
        palette.push({
          r: dataView.getUint8(offset + 0),
          g: dataView.getUint8(offset + 1),
          b: dataView.getUint8(offset + 2),
          pixelCount: dataView.getUint32(offset + 4, true),
        });
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        palette,
        meta: {
          executionTimeMs: endTime - startTime,
          nodeCount: count,
          image: {
            name: imageInfo.name,
            width: imageInfo.width,
            height: imageInfo.height,
            bytes: imageBytes.length,
          },
          engine: "Zig (Wasm) in Browser",
        },
      }));
    } catch (err) {
      console.error("Quantization Error:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `Quantization failed: ${err.message}`,
      }));
    }
  };

  const setSortMode = (mode) => setState((prev) => ({ ...prev, sortMode: mode }));
  const setSelectedColor = (color) => setState((prev) => ({ ...prev, selectedColor: color }));
  const clearError = () => setState((prev) => ({ ...prev, error: null }));

  return {
    state: { ...state, displayedPalette },
    actions: {
      processImageFile,
      runQuantization,
      setSortMode,
      setSelectedColor,
      clearError,
    },
  };
}

function decodeImageToBytes(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas context could not be created."));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const bytes = new Uint8Array(imageData.data.buffer.slice(0));
      URL.revokeObjectURL(url);
      resolve({ bytes, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load."));
    };
    img.src = url;
  });
}
