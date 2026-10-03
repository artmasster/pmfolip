import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { indicatorSnapshot } from "./src/data/catalog";

export default defineConfig({
  base: "/pmfolip/",
  plugins: [
    react(),
    {
      name: "publish-evidence-snapshot",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "data/indicators.json",
          source: JSON.stringify(indicatorSnapshot, null, 2) + "\n",
        });
        for (const [source, fileName] of [
          ["src/data/leaders.json", "data/leaders.json"],
          ["src/data/indicators.json", "data/indicators-worldbank.json"],
          [
            "src/data/historical-indicators.json",
            "data/indicators-historical.json",
          ],
          [
            "src/data/extended-indicators.json",
            "data/indicators-extended.json",
          ],
          ["docs/methodology.md", "data/methodology.md"],
          ["docs/development.md", "data/development.md"],
          ["docs/leader-sources.md", "data/leader-sources.md"],
          ["docs/historical-data.md", "data/historical-data.md"],
          ["docs/extended-data.md", "data/extended-data.md"],
        ])
          this.emitFile({
            type: "asset",
            fileName,
            source: readFileSync(source, "utf8"),
          });
      },
    },
  ],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
          if (id.includes("/src/data/")) return "evidence";
        },
      },
    },
  },
});
