module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  roots: ["<rootDir>/backend/project-service"],
  collectCoverage: true,
  collectCoverageFrom: [
    "backend/project-service/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "backend/project-service/coverage"
};