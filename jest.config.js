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
      `!backend/${service}/node_modules/**`,
      `!backend/${service}/coverage/**`,
      `!backend/${service}/server.js`,
      `!backend/${service}/config/db.js`
    ],
    coverageReporters: ["lcov", "text"],
    coverageDirectory: `backend/${service}/coverage`
  }))
};