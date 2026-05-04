module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  roots: ["<rootDir>/backend/conge-service"],
  collectCoverage: true,
  collectCoverageFrom: [
    "backend/conge-service/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "backend/conge-service/coverage"
};