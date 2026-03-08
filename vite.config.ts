import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const devPlugins = [react(), componentTagger()];
const prodPlugins = [react()];

export default defineConfig(({ mode }) => ({
  plugins: mode === "development" ? devPlugins : prodPlugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

