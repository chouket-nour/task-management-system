module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  roots: ["<rootDir>/backend/user-service"],
  collectCoverage: true,
  collectCoverageFrom: [
    "backend/user-service/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "backend/user-service/coverage"
};