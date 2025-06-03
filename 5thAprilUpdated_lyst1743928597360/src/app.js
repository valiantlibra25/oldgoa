import express from "express";
import {} from '../src/routes/auth.routes.js'
const app = express();

//router imports
import healthCheckRouter from "./routes/healthcheck.routes.js"
import router from "./routes/auth.routes.js";

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use("/api/v1/healthcheck", healthCheckRouter)
app.use("/api/v1/user",router)

export default app;
