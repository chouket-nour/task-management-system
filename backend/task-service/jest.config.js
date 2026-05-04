module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  roots: ["<rootDir>/backend/task-service"],
  collectCoverage: true,
  collectCoverageFrom: [
    "backend/task-service/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "backend/task-service/coverage"
};