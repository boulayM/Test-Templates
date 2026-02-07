export default {
  testEnvironment: "node",
  verbose: true,
  testTimeout: 20000,

  // Jest ne doit pas transformer les fichiers (ESM natif)
  transform: {},

  // 1) Charge .env.test AVANT tout (process principal)
  globalSetup: "<rootDir>/tests/loadEnvTest.js",

  // 2) Reset DB + seed admin APRÃˆS que lâ€™environnement soit chargÃ©
  setupFilesAfterEnv: ["<rootDir>/tests/setupTestDB.js", "<rootDir>/tests/setupMongoTestDB.js"],

  // Extensions reconnues
  moduleFileExtensions: ["js", "json"]
};
