/// <reference types="vite/client" />

interface ImportMetaEnv {
	// readonly MAIN_VITE_ANTHROPIC_API_KEY: string // this var only exists in the main process
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
