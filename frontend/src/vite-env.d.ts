/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_INDEXER_URL: string;
    readonly VITE_ALEO_NETWORK: string;
    // Add other env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
