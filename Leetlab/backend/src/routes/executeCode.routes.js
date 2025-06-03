import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { executeCode } from '../controllers/executeCode.controller.js'

const excecutionRoutes = express.Router()

excecutionRoutes.post("/", authMiddleware, executeCode)


export default excecutionRoutes