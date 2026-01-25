import wasmModule from "../../zig-out/bin/chroma_lattice.wasm";

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      const instance = await WebAssembly.instantiate(wasmModule, {});
      const { run_octree, get_result_pointer, memory } = instance.exports;

      const startTime = performance.now();
      const count = run_octree();
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
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
