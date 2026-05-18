module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.svg$": "<rootDir>/test/__mocks__/svgMock.js",
  },
  setupFiles: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: ["utils/**/*.{ts,tsx}", "!utils/**/*.d.ts"],
};
