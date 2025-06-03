import { asyncHandler } from "../utils/async-handler.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ApiError } from "../utils/api-error.js";
import { TaskStatusEnum } from "../utils/constants.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/api-response.js";
import mongoose from "mongoose";

const createSubTask = asyncHandler(async (req, res) => {
  const { title, taskId, isCompleted = false } = req.body;
  const userId = req.user._id;

  const titleTrimmed = title?.trim();
  if (!titleTrimmed || !taskId) {
    throw new ApiError(400, "Title and taskId are required fields.");
  }

  const isValidTask = await Task.findById(taskId);

  if (!isValidTask) {
    throw new ApiError(404, "Task with the given ID was not found.");
  }

  const existingSubTask = await SubTask.findOne({
    title: titleTrimmed,
    task: taskId,
  });
  if (existingSubTask) {
    throw new ApiError(
      409,
      "A SubTask with the same title already exists for this task.",
    );
  }

  const subTask = await SubTask.create({
    title,
    task: taskId,
    isCompleted,
    createdBy: userId,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, subTask, "SubTask has been created successfully."),
    );
});

const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    projectId,
    assignedTo,
    status = TaskStatusEnum.TODO,
  } = req.body;
  const userId = req.user._id;

  const titleTrimmed = title?.trim();

  if (!titleTrimmed || !projectId || !assignedTo) {
    throw new ApiError(
      400,
      "Title, projectId, and assignedTo are required fields.",
    );
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project with the given ID was not found.");
  }

  const isMember = await ProjectMember.findOne({
    project: projectId,
    user: assignedTo,
  });
  if (!isMember) {
    throw new ApiError(
      403,
      "Assigned user is not a member of the specified project.",
    );
  }

  const files = req.files ?? [];
  const uploadedAttachments = [];

  for (const file of files) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.url) {
      uploadedAttachments.push({
        url: uploaded.url,
        mimetype: file.mimetype,
        size: file.size,
      });
    }
  }

  if (req.files && uploadedAttachments.length === 0) {
    throw new ApiError(400, "Failed to upload any attachments.");
  }

  const task = await Task.create({
    title,
    description: description.trim(),
    project: projectId,
    assignedTo,
    assignedBy: userId,
    status,
    attachments: uploadedAttachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task has been created successfully."));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subTaskId } = req.params;
  const deletedSubTask = await SubTask.findByIdAndDelete(subTaskId);

  if (!deletedSubTask) {
    throw new ApiError(404, "SubTask not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedSubTask,
        `SubTask with ID ${subTaskId} has been deleted successfully.`,
      ),
    );
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  for (const attachment of task.attachments) {
    await deleteFromCloudinary(attachment.url);
  }

  await Task.findByIdAndDelete(taskId);

  const deletedSubTasks = await SubTask.deleteMany({ task: taskId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deletedTaskId: taskId,
        deletedSubTasksCount: deletedSubTasks.deletedCount,
      },
      `Task and ${deletedSubTasks.deletedCount} subtask(s) associated with it have been deleted successfully.`,
    ),
  );
});

const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, "Invalid task ID format");
  }

  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId.createFromHexString(taskId),
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
      },
    },
  ]);

  if (!task.length) {
    throw new ApiError(404, "Task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Get Task Successfully"));
});

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.aggregate([
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Fetched all tasks with subtasks"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { taskId, subTaskId } = req.params;
  const { isCompleted, title } = req.body;

  if (!taskId || !subTaskId) {
    throw new ApiError(400, "taskId and subTaskId are required");
  }

  const updatedSubTask = await SubTask.findOneAndUpdate(
    { _id: subTaskId, task: taskId },
    {
      ...(typeof isCompleted === "boolean" && { isCompleted }),
      ...(title && { title }),
    },
    { new: true },
  );

  if (!updatedSubTask) {
    throw new ApiError(
      404,
      "SubTask not found for the given taskId and subTaskId",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSubTask, "SubTask updated successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user?._id;
  const {
    title,
    description,
    projectId,
    assignedTo,
    status = TaskStatusEnum.TODO,
  } = req.body;

  if (!taskId) {
    throw new ApiError(400, "taskId is required");
  }

  // Validate status
  if (status && !Object.values(TaskStatusEnum).includes(status)) {
    throw new ApiError(400, "Invalid task status");
  }

  const files = req.files ?? [];
  const uploadedAttachments = [];

  for (const file of files) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.url) {
      uploadedAttachments.push({
        url: uploaded.url,
        mimetype: file.mimetype,
        size: file.size,
      });
    }
  }

  if (req.files && uploadedAttachments.length === 0) {
    throw new ApiError(400, "Failed to upload any attachments.");
  }

  const updateData = {
    ...(title && { title: title.trim() }),
    ...(description && { description: description.trim() }),
    ...(assignedTo && { assignedTo }),
    ...(userId && { assignedBy: userId }),
    ...(status && { status }),
    ...(uploadedAttachments.length && { attachments: uploadedAttachments }),
  };

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, ...(projectId && { project: projectId }) },
    updateData,
    { new: true },
  );

  if (!updatedTask) {
    throw new ApiError(404, "Task not found for the given taskId");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};
