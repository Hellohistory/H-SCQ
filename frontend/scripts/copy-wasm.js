import { access, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("..", "zig-out", "bin", "chroma_lattice.wasm");
const destDir = resolve("public");
const dest = resolve(destDir, "chroma_lattice.wasm");

try {
  await access(source);
} catch (err) {
  console.error("Missing wasm file at", source);
  console.error("Run `zig build` before building the frontend.");
  process.exit(1);
}

await mkdir(destDir, { recursive: true });
await copyFile(source, dest);
console.log("Copied wasm to", dest);
