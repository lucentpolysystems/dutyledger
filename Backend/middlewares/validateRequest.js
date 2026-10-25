import { z } from "zod";

/**
 * Higher-order middleware to validate incoming request body/params/query with a Zod schema.
 */
export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace with sanitized & typed data
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Request validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common reusable validation schemas
export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username or Email is required").trim(),
    password: z.string().min(1, "Password is required"),
    id: z.string().min(1, "User ID is required").trim(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});

export default {
  validateRequest,
  loginSchema,
  changePasswordSchema,
  setPasswordSchema,
};
