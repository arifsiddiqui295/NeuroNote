const express = require("express");
const { createLesson, getLessons, deleteLesson } = require("../controllers/lessonController");
const { protect } = require("../middlewares/authMiddleware");
const { checkWorkspaceMembership } = require("../middlewares/permissionMiddleware");

const router = express.Router();

router.post("/", protect, checkWorkspaceMembership, createLesson);
router.get("/workspace/:workspaceId", protect, checkWorkspaceMembership, getLessons);
router.delete("/:lessonId", protect, deleteLesson);
module.exports = router;
