/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
	coverageProvider: 'v8',
	displayName: 'unit test',
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
	reporters: ['default', 'github-actions'],
	transform: {
		'^.+\\.tsx?$': 'esbuild-jest'
	}
};

export default config;
