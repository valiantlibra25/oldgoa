import { ApiResponse } from "../utils/api-response.js";

const healthCheck = (req, res) => {
  res.json(new ApiResponse(200, { message: "Server is running" }));
};

export { healthCheck };
