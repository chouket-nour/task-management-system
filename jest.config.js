const path = require('path');
const services = [
  "auth-service", "user-service", "task-service",
  "project-service", "conge-service", "notification-service"
];

module.exports = {
  projects: services.map(service => ({
    displayName: service,
    testEnvironment: "node",
    rootDir: path.resolve(__dirname, `backend/${service}`),
    roots: [`<rootDir>`],
    testTimeout: 30000, // FIX : timeout augmenté pour MongoMemoryServer sur VM

    collectCoverageFrom: [
      `<rootDir>/**/*.js`,
      `!<rootDir>/node_modules/**`,
      `!<rootDir>/coverage/**`,
      `!<rootDir>/server.js`,
      `!<rootDir>/config/db.js`
    ],
    coverageReporters: ["lcov", "text"],
    // Use absolute path so it always resolves to backend/<service>/coverage
    coverageDirectory: path.resolve(__dirname, `backend/${service}/coverage`)
  }))
};