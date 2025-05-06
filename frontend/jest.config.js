module.exports = {
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js"
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    transform: {
      "^.+\\.(js|jsx)$": "babel-jest"
    },
    transformIgnorePatterns: [
      "/node_modules/(?!remixicon).+\\.js$"
    ],
    collectCoverageFrom: [
      "src/**/*.{js,jsx}",
      "!src/**/*.test.{js,jsx}",
      "!src/index.js",
      "!src/reportWebVitals.js"
    ],
    coverageThreshold: {
      global: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50
      }
    }
  };