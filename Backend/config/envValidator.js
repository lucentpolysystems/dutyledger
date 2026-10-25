/**
 * Validates critical environment variables on application startup.
 * Halts process startup immediately if mission-critical configurations are missing.
 */
export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const errors = [];

  // Database URL check
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is not defined in environment variables.");
  }

  // JWT Secret check
  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is required.");
  } else if (process.env.JWT_SECRET.length < 16) {
    errors.push("JWT_SECRET must be at least 16 characters long for cryptographic security.");
  }

  if (errors.length > 0) {
    console.error("❌ CRITICAL ENVIRONMENT CONFIGURATION ERRORS:");
    errors.forEach((err) => console.error(`   - ${err}`));
    if (isProduction) {
      console.error("Halting application startup due to invalid production environment.");
      process.exit(1);
    }
  } else {
    console.log("🔒 Environment configuration validated successfully.");
  }
};

export default validateEnv;
