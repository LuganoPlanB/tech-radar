import path from "node:path";

import { defineConfig } from "vite";

import { generateRadarDataModule } from "./scripts/generate-radar-data-module.mjs";

function radarDataWatcher() {
  const dataRoot = path.resolve(process.cwd(), "data");
  const generatedModule = path.resolve(process.cwd(), "src", "generated", "radarData.mjs");

  return {
    name: "radar-data-watcher",
    configureServer(server) {
      const watchedPatterns = [path.join(dataRoot, "**", "*.yml")];

      server.watcher.add(watchedPatterns);

      const regenerate = (changedFile) => {
        if (!changedFile.startsWith(dataRoot)) {
          return;
        }

        if (!changedFile.endsWith(".yml")) {
          return;
        }

        generateRadarDataModule();
        const moduleNode = server.moduleGraph.getModuleById(generatedModule);
        if (moduleNode) {
          server.moduleGraph.invalidateModule(moduleNode);
        }
        server.ws.send({ type: "full-reload" });
      };

      server.watcher.on("add", regenerate);
      server.watcher.on("change", regenerate);
      server.watcher.on("unlink", regenerate);
    },
  };
}

export default defineConfig({
  base: "/tech-radar/",
  plugins: [radarDataWatcher()],
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
});
