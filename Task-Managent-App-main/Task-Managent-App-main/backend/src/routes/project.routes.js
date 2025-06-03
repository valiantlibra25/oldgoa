import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
} from "../controllers/project.controllers.js";

const router = Router();

router.route("/add-member").post(verifyJWT, addMemberToProject);
router.route("/create-project").post(verifyJWT, createProject);
router.route("/delete-member").delete(verifyJWT, deleteMember);
router.route("/delete-project/:projectId").delete(verifyJWT, deleteProject);
router.route("/get-project/:projectId").get(verifyJWT, getProjectById);
router.route("/get-member/:projectId").get(verifyJWT, getProjectMembers);
router.route("/get-projects").get(verifyJWT, getProjects);
router.route("/update-role").post(verifyJWT, updateMemberRole);
router.route("/update-role/:projectId").post(verifyJWT, updateProject);

export default router;
