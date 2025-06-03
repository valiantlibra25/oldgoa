import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum } from "../utils/constants.js";

const addMemberToProject = asyncHandler(async (req, res) => {
  const { projectId, userId, role = UserRolesEnum.MEMBER } = req.body;

  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  if (existingMember) {
    throw new ApiError(400, "User already a member of this project");
  }

  const newMember = await ProjectMember.create({
    project: projectId,
    user: userId,
    role,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newMember, "Member Added Successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;

  if (!name) {
    throw new ApiError(400, "Project Name is required");
  }

  const existingProject = await Project.findOne({ name });

  if (existingProject) {
    throw new ApiError(400, "Project with this name already exists");
  }

  const newProject = await Project.create({
    name,
    description,
    createdBy: userId,
  });

  await newProject.save()
  return res
    .status(201)
    .json(new ApiResponse(201, newProject, "Project Created Successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.body;

  const removeMember = await ProjectMember.findOneAndDelete({
    project: projectId,
    user: userId,
  });

  if (!removeMember) {
    throw new ApiError(404, "Member not found in the project");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Member removed successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const deletedProject = await Project.findByIdAndDelete(projectId);

  if (!deletedProject) {
    throw new ApiError(404, "Project not found");
  }

  // Also delete all members linked to this project
  await ProjectMember.deleteMany({ project: projectId });

  return res
    .status(200)
    .json(new ApiResponse(200, "Project and members deleted successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if user is a member of the project
  const isMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  if (!isMember) {
    throw new ApiError(
      403,
      "Access denied. You are not a member of this project.",
    );
  }

  const project = await Project.findById(projectId).populate(
    "createdBy",
    "username email",
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res.status(200).json(new ApiResponse(201, project, "Get Project"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if requesting user is a member of this project
  const isMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });

  if (!isMember) {
    throw new ApiError(
      403,
      "Access denied. You are not a member of this project.",
    );
  }

  // Fetch all members of the project
  const members = await ProjectMember.find({ project: projectId }).populate(
    "user",
    "username email avatar",
  );

  return res.status(200).json(new ApiResponse(200, members));
});

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all project memberships for this user
  const memberships = await ProjectMember.find({ user: userId }).select(
    "project",
  );

  const projectIds = memberships.map((m) => m.project);

  const projects = await Project.find({ _id: { $in: projectIds } });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Get All Projects"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, memberId, newRole } = req.body;

  // Optional: verify that the user has permission (e.g., only ADMIN can update)
  const currentUserRole = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });
  if (currentUserRole?.role !== UserRolesEnum.ADMIN) {
    throw new ApiError(403, "Only ADMIN can update member roles");
  }

  const member = await ProjectMember.findOneAndUpdate(
    { project: projectId, user: memberId },
    { role: newRole },
    { new: true },
  );

  if (!member) {
    throw new ApiError(404, "Member not found in this project");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, member, "Member has been updated Successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  // Optional: ensure only creator or ADMIN can update
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project Not found");
  }

  const member = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });
  if (
    String(project.createdBy) !== String(req.user._id) &&
    member?.role !== UserRolesEnum.ADMIN
  ) {
    throw new ApiError(403, "Not authorized to update this project");
  }

  project.name = name ?? project.name;
  project.description = description ?? project.description;

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(201, project, "Updated Successfully"));
});

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
};
