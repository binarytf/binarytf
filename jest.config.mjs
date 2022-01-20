/** @type {import('@jest/types').Config.InitialOptions} */
export default {
	coverageProvider: 'v8',
	displayName: 'unit test',
	testEnvironment: 'node',
	testRunner: 'jest-circus/runner',
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	transform: {
		'^.+\\.tsx?$': 'esbuild-jest'
	}
};
