// vite.config.ts
import { defineConfig } from "file:///D:/APLIKASI/sheetlabai/chat-to-edit/node_modules/vite/dist/node/index.js";
import react from "file:///D:/APLIKASI/sheetlabai/chat-to-edit/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/APLIKASI/sheetlabai/chat-to-edit/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\APLIKASI\\sheetlabai\\chat-to-edit";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: process.env.TEMPO === "true" ? "0.0.0.0" : "::",
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : void 0,
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxBUExJS0FTSVxcXFxzaGVldGxhYmFpXFxcXGNoYXQtdG8tZWRpdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcQVBMSUtBU0lcXFxcc2hlZXRsYWJhaVxcXFxjaGF0LXRvLWVkaXRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0FQTElLQVNJL3NoZWV0bGFiYWkvY2hhdC10by1lZGl0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogcHJvY2Vzcy5lbnYuVEVNUE8gPT09IFwidHJ1ZVwiID8gXCIwLjAuMC4wXCIgOiBcIjo6XCIsXHJcbiAgICAvLyBAdHMtaWdub3JlXHJcbiAgICBhbGxvd2VkSG9zdHM6IHByb2Nlc3MuZW52LlRFTVBPID09PSBcInRydWVcIiA/IHRydWUgOiB1bmRlZmluZWQsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1TLFNBQVMsb0JBQW9CO0FBQ2hVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNLFFBQVEsSUFBSSxVQUFVLFNBQVMsWUFBWTtBQUFBO0FBQUEsSUFFakQsY0FBYyxRQUFRLElBQUksVUFBVSxTQUFTLE9BQU87QUFBQSxJQUNwRCxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUM5RSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
