const express = require('express');
const { createWorkspace, getWorkspaces, inviteMember, removeMember, updateMemberRole, deleteWorkspace, leaveWorkspace } = require('../controllers/workspaceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();


router.route('/').post(protect, createWorkspace)
router.route('/').get(protect, getWorkspaces);
router.post('/:workspaceId/invite', protect, inviteMember);
router.delete('/:workspaceId/members/:userId', protect, removeMember);
router.put('/:workspaceId/members/:userId', protect, updateMemberRole);
router.delete('/:workspaceId', protect, deleteWorkspace);
router.delete('/:workspaceId/leave', protect, leaveWorkspace);
module.exports = router;