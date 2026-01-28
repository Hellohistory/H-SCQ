import wasmModule from "../../zig-out/bin/chroma_lattice.wasm";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, X-Image-Width, X-Image-Height, X-Image-Name",
        },
      });
    }

    try {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const width = Number(request.headers.get("X-Image-Width")) || 0;
      const height = Number(request.headers.get("X-Image-Height")) || 0;
      const name = request.headers.get("X-Image-Name") || "image";
      const imageBytes = new Uint8Array(await request.arrayBuffer());

      if (!imageBytes.length) {
        return new Response(JSON.stringify({ error: "Empty image payload." }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const instance = await WebAssembly.instantiate(wasmModule, {});
      const { run_octree, get_result_pointer, alloc_image_buffer, memory } = instance.exports;

      const imagePtr = alloc_image_buffer(imageBytes.length);
      if (!imagePtr) {
        return new Response(JSON.stringify({ error: "Image too large for wasm buffer." }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
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

      const responseData = {
        meta: {
          executionTimeMs: endTime - startTime,
          nodeCount: count,
          image: {
            name,
            width,
            height,
            bytes: imageBytes.length,
          },
          engine: "Zig (Wasm) + Cloudflare Workers",
        },
        data: palette,
      };

      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
