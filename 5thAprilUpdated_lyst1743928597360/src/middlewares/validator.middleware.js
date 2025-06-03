import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => err.msg);
     throw new ApiError(422, extractedErrors.join(", "));
  }

  // const extractedError = [];
  // errors.array().map(err =>
  //   (extractedError.push({
  //     [err.path]: err.msg,
  //   })),
  // );
  next()

};
