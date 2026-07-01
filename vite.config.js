import { defineConfig } from "vite";

export default defineConfig({

    // index.html がある場所
    root: "src",

    build: {

        // Capacitor が読む www フォルダへ出力
        outDir: "../www",

        // www を空にしてから出力
        emptyOutDir: true

    }

});