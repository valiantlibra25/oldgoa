import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controllers.js";

const router = Router();

router.route("/:projectId").post(verifyJWT, createNote);
router.route("/:noteId").delete(verifyJWT, deleteNote);
router.route("/:noteId").get(verifyJWT, getNoteById);
router.route("/").get(verifyJWT, getNotes);
router.route("/:projectId/:noteId").post(verifyJWT, updateNote);

export default router;
