import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
} from "../controllers/task.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/create")
  .post(verifyJWT, upload.array("attachments"), createTask);
router.route("/create-subtask").post(verifyJWT, createSubTask);
router.route("/delete-subtask/:subTaskId").delete(verifyJWT, deleteSubTask);
router.route("/delete/:taskId").delete(verifyJWT, deleteTask);
router.route("/:taskId").get(verifyJWT, getTaskById);
router.route("/").get(verifyJWT, getTasks);
router.route("/sub-task/:taskId/:subTaskId").patch(verifyJWT, updateSubTask);
router
  .route("/:taskId")
  .patch(verifyJWT, upload.array("attachments"), updateTask);

export default router;
