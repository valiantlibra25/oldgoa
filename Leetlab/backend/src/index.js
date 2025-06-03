import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.routes.js'
import problemRoutes from './routes/problem.routes.js'
import excecutionRoutes from './routes/executeCode.routes.js'
import submissionRoutes from './routes/submission.routes.js'
import playlistRoutes from './routes/playlist.routes.js'


dotenv.config()
const app = express()

app.use(express.json())
app.use(cookieParser())

app.get("/",(req,res)=>{
    res.send("Hello Welcome to Leet Lab")
})

app.use("/api/v1/auth", authRoutes)

app.use("/api/v1/problems",problemRoutes)

app.use("/api/v1/excute-code",excecutionRoutes)

app.use("/api/v1/submission", submissionRoutes)

app.use("/api/v1/playlist", playlistRoutes)

app.listen(process.env.PORT,()=>{
    console.log("Server is running on 8080")
})