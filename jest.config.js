module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom', // Changed from node to jsdom for React tests
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Add setup file
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        // Handle CSS imports (common in Next.js)
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            // Enable jsx support in ts-jest
            jsx: 'react-jsx'
        }],
    },
    testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/node_modules/'],
};
