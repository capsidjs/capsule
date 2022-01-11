import { build } from "https://deno.land/x/dnt@0.14.0/mod.ts";
import { join } from "https://deno.land/std@0.119.0/path/mod.ts";

const outDir = "node";

await build({
  entryPoints: ["./mod.ts"],
  outDir,
  shims: {
    deno: {
      test: "dev",
    },
  },
  redirects: {
    "./dom_polyfill_deno.ts": "./dom_polyfill_node.ts",
  },
  test: true,
  package: {
    name: "@kt3k/capsule",
    version: "0.4.0",
    description: "Event-driven DOM programming in a new style",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/capsidjs/capsule.git",
    },
    bugs: {
      url: "https://github.com/capsidjs/capsule/issues",
    },
    devDependencies: {
      jsdom: "^19.0.0",
      "@types/jsdom": "^16.2.14",
    },
  },
});

Deno.copyFileSync("LICENSE", join(outDir, "LICENSE"));
Deno.copyFileSync("README.md", join(outDir, "README.md"));
