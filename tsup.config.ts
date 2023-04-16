import { defineConfig } from 'tsup';

export default defineConfig({
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	format: ['esm', 'cjs', 'iife'],
	minify: false,
	skipNodeModulesBundle: true,
	sourcemap: true,
	target: 'es2021',
	tsconfig: 'src/tsconfig.json',
	keepNames: true,
	globalName: 'BinaryTF'
});
