import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			enabled: true,
			reporter: ['text', 'lcov', 'cobertura']
		}
	},
	esbuild: {
		target: 'es2022'
	}
});
