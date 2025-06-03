import { Note } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler.js";

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const isValidProject = await Project.findById(projectId);

  if (!isValidProject) {
    throw new ApiError(404, "Project with given id is not found");
  }

  const existingNote = await Note.findOne({
    project: projectId,
    content: content.trim(),
  });

  if (existingNote) {
    throw new ApiError(
      409,
      "A note with the same content already exists for this project.",
    );
  }

  const note = await Note.create({
    project: projectId,
    content: content.trim(),
    createdBy: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note has been created successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const deletedNotes = await Note.findByIdAndDelete(noteId);

  if (!deletedNotes) {
    throw new ApiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Notes has been deleted."));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findById(noteId);

  if (!note) {
    throw new ApiError(404, "Note not found with given id");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, note, "Note get successfully."));
});

const getNotes = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, projectId } = req.query;

  const filter = projectId ? { project: projectId } : {};

  const notes = await Note.find(filter)
    .populate("project", "name")
    .populate("createdBy", "name email")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const totalCount = await Note.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notes,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      "Notes fetched successfully",
    ),
  );
});

const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(404, "Content is required");
  }

  const updatedNote = await Note.findOneAndUpdate(
    {
      _id: noteId,
      ...(projectId && { project: projectId }),
    },
    { content },
    { new: true },
  );

  if (!updatedNote) {
    throw new ApiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, updatedNote, "Note get successfully."));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
