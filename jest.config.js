const services = [
  "auth-service",
  "user-service",
  "task-service",
  "project-service",
  "conge-service",
  "notification-service"
];

module.exports = {
  projects: services.map(service => ({
    displayName: service,
    testEnvironment: "node",
    rootDir: __dirname,
    roots: [`<rootDir>/backend/${service}`],
    collectCoverage: true,
    collectCoverageFrom: [
      `backend/${service}/**/*.js`,
      "!**/node_modules/**",
      "!**/coverage/**",
      "!**/jest.config.js",
      "!**/server.js",
      "!**/config/db.js"
    ],
    coverageReporters: ["lcov", "text"],
    coverageDirectory: `backend/${service}/coverage`
  }))
};