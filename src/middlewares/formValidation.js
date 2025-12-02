import { ZodError } from "zod";
import apiResponse from "../utils/apiResponse.js";
import { errorMessages } from "../constants/messages.js";

export function formValidation(schema) {
  return async function (req, res, next) {
    try {
      const body = await schema.parseAsync(req.body);

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        // ZodError contains `errors` array with details
        const formattedErrors = err.issues.map((e) => ({
          path: e.path.join("."), // which field failed
          message: e.message, // validation message
        }));

        return apiResponse.error(res, formattedErrors, 400);
      }
      // fallback for unexpected errors
      return apiResponse.error(res, errorMessages.USER.VALIDATION_ERROR, 400);
    }
  };
}
