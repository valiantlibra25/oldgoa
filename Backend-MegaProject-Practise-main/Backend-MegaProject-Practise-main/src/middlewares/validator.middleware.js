import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next) => {
  console.log("Request body:", req.body);
  console.log("Request query:", req.query);
  const errors = validationResult(req);
  console.log("Validation errors:", errors.array());

  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) =>
    extractedErrors.push({
      [err.path]: err.msg,
    }),
  );

  console.error("Validation errors:", extractedErrors); // Log the validation errors

  throw new ApiError(422, "Received data is not valid.", extractedErrors);
};
