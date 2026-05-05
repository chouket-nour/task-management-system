const path = require('path');

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
    rootDir: path.resolve(__dirname, `backend/${service}`),
    roots: [`<rootDir>`],
    collectCoverageFrom: [
      `<rootDir>/**/*.js`,
      `!<rootDir>/node_modules/**`,
      `!<rootDir>/coverage/**`,
      `!<rootDir>/server.js`,
      `!<rootDir>/config/db.js`
    ],
    coverageReporters: ["lcov", "text"],
    coverageDirectory: `<rootDir>/coverage`
  }))
};