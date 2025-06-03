import express from "express";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cookieParser());

//router imports
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import { globalErrorHandler } from "./middlewares/error-handler.middleware.js";

app.use("/api/v1/healthcheck", healthCheckRouter);

// auth routes
app.use("/api/v1/users", authRouter);
//project routes
app.use("/api/v1/projects", projectRouter);
//task routes
app.use("/api/v1/tasks", taskRouter);

// should be the last middleware
app.use(globalErrorHandler);

export default app;
