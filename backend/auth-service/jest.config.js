module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  roots: ["<rootDir>/backend/auth-service"],
  collectCoverage: true,
  collectCoverageFrom: [
    "backend/auth-service/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "backend/auth-service/coverage"
};