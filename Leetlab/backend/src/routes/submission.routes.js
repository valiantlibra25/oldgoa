import express from 'express'
import { getAllSubmission, getAllSubmissionsForProblem, getAllTheSubmissionForProblem } from '../controllers/submission.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const submissionRoutes = express.Router()

submissionRoutes.get("/get-all-submissions", authMiddleware, getAllSubmission)
submissionRoutes.get("/get-submission/:problemId",authMiddleware,getAllSubmissionsForProblem)
submissionRoutes.get("/get-submissions-count/:problemId", authMiddleware, getAllTheSubmissionForProblem)

export default submissionRoutes