import { useState, useMemo } from "react";
import { processPaletteData, sortPalette } from "../core/palette";

const API_ENDPOINT = "https://hscq.nestools.net/";

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
                error: "无法解析图片文件，请确保格式正确。",
                imageBytes: null,
                imageInfo: null,
            }));
        }
    };

    const runQuantization = async () => {
        const { imageBytes, imageInfo } = state;
        if (!imageBytes || !imageInfo) {
            setState((prev) => ({ ...prev, error: "请先选择一张图片。" }));
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null, selectedColor: null }));

        try {
            const res = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "X-Image-Width": String(imageInfo.width),
                    "X-Image-Height": String(imageInfo.height),
                    "X-Image-Name": imageInfo.name,
                },
                body: imageBytes,
            });

            // 处理非 200 响应，比如 405 Method Not Allowed
            if (!res.ok) {
                let errorMsg = `HTTP Error: ${res.status}`;
                try {
                    const errJson = await res.json();
                    if (errJson.error) errorMsg = errJson.error;
                } catch (_) {
                }
                throw new Error(errorMsg);
            }

            const json = await res.json();
            if (json.error) throw new Error(json.error);

            setState((prev) => ({
                ...prev,
                loading: false,
                palette: json.data,
                meta: json.meta,
            }));
        } catch (err) {
            console.error("Quantization Error:", err);
            setState((prev) => ({
                ...prev,
                loading: false,
                error: `执行失败: ${err.message}`,
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
                reject(new Error("Canvas Context 无法创建"));
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
            reject(new Error("图片加载失败"));
        };
        img.src = url;
    });
}