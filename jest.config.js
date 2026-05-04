const services = [
  "auth-service",
  "user-service",
  "task-service",
  "project-service",
  "conge-service",
  "notification-service"
];

module.exports = {
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  collectCoverageFrom: services.flatMap(service => [
    `backend/${service}/**/*.js`,
    `!backend/${service}/node_modules/**`,
    `!backend/${service}/coverage/**`,
    `!backend/${service}/jest.config.js`,
    `!backend/${service}/server.js`,
    `!backend/${service}/config/db.js`
  ]),
  coverageDirectory: "coverage",
  projects: services.map(service => ({
    displayName: service,
    testEnvironment: "node",
    rootDir: __dirname,
    roots: [`<rootDir>/backend/${service}`]
  }))
};