const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Note = require('../models/Note');
const Question = require('../models/Question');
const UserProgress = require('../models/UserProgress');
const { sendNotification } = require('../utils/notificationManager');
// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        const { name, context } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Workspace name is required.' });
        }

        const newWorkspace = await Workspace.create({
            name,
            context: context || 'General Knowledge', // Default context
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'admin' }] // Add the creator as an admin
        });

        res.status(201).json(newWorkspace);
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating workspace.' });
    }
};

// @desc    Get all workspaces for the logged-in user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ 'members.user': req.user._id })
            // Populate the 'owner' field, but ONLY get username and email
            .populate('owner', 'username email')
            // Populate the 'members.user' field inside the array, ONLY get username and email
            .populate('members.user', 'username email');

        res.status(200).json(workspaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching workspaces.' });
    }
};
const inviteMember = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { email, role } = req.body; // e.g., "editor" or "viewer"

        // 1. Find the user you want to invite by their email
        const userToInvite = await User.findOne({ email });
        if (!userToInvite) {
            return res.status(404).json({ message: 'User with that email not found.' });
        }

        // 2. Find the workspace
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // 3. Check if the logged-in user is an admin of this workspace
        const adminMember = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
        );
        if (!adminMember) {
            return res.status(403).json({ message: 'You do not have permission to add members.' });
        }

        // 4. Check if the user is already a member
        const alreadyMember = workspace.members.find(
            (m) => m.user.toString() === userToInvite._id.toString()
        );
        if (alreadyMember) {
            return res.status(400).json({ message: 'User is already a member of this workspace.' });
        }

        // 5. Add the new member and save
        workspace.members.push({ user: userToInvite._id, role: role || 'viewer' });
        await workspace.save();

        res.status(200).json(workspace.members);

    } catch (error) {
        res.status(500).json({ message: 'Server error inviting member.' });
    }
};

const removeMember = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // Check if the current user is an admin
        const adminMember = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
        );
        if (!adminMember) {
            return res.status(403).json({ message: 'You do not have permission to remove members.' });
        }

        // Prevent admin from removing the owner
        if (workspace.owner.toString() === userId) {
            return res.status(400).json({ message: 'Cannot remove the workspace owner.' });
        }

        // Remove the member
        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== userId
        );

        await workspace.save();
        res.status(200).json(workspace.members);

    } catch (error) {
        res.status(500).json({ message: 'Server error removing member.' });
    }
};

// --- NEW FUNCTION ---
// @desc    Update a member's role
// @route   PUT /api/workspaces/:workspaceId/members/:userId
// @access  Private (Admin only)
const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const { role } = req.body; // New role (e.g., "editor", "viewer")

        if (!role) {
            return res.status(400).json({ message: 'Role is required.' });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // Check if the current user is an admin
        const adminMember = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
        );
        if (!adminMember) {
            return res.status(403).json({ message: 'You do not have permission to change roles.' });
        }

        // Find the member to update
        const memberToUpdate = workspace.members.find(
            (m) => m.user.toString() === userId
        );
        if (!memberToUpdate) {
            return res.status(404).json({ message: 'Member not found in this workspace.' });
        }

        // Update the role and save
        memberToUpdate.role = role;
        await workspace.save();
        console.log("Updated member role:", memberToUpdate);
        // Notify the user instantly ---
        sendNotification(userId, {
            type: 'ROLE_UPDATED',
            workspaceId: workspace._id,
            newRole: role
        });

        res.status(200).json(workspace.members);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating member role.' });
    }
};


const deleteWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // 1. Check if the user is the owner
        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the workspace owner can delete it.' });
        }

        // 2. Find all lessons in this workspace
        const lessons = await Lesson.find({ workspace: workspaceId });
        const lessonIds = lessons.map(l => l._id);

        // 3. Find all questions in those lessons
        const questions = await Question.find({ lesson: { $in: lessonIds } });
        const questionIds = questions.map(q => q._id);

        // 4. Perform Cascade Delete
        await Promise.all([
            UserProgress.deleteMany({ workspace: workspaceId }),
            Question.deleteMany({ workspace: workspaceId }),
            Note.deleteMany({ workspace: workspaceId }),
            Lesson.deleteMany({ workspace: workspaceId }),
            Workspace.findByIdAndDelete(workspaceId)
        ]);

        res.status(200).json({ message: 'Workspace and all associated data deleted.' });

    } catch (error) {
        console.error("Error deleting workspace:", error);
        res.status(500).json({ message: 'Server error deleting workspace.' });
    }
};

const leaveWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user._id;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // Owner cannot leave
        if (workspace.owner.toString() === userId.toString()) {
            return res.status(400).json({ message: 'The owner cannot leave the workspace. You must delete it or transfer ownership.' });
        }

        // Remove the user from members array
        workspace.members = workspace.members.filter(
            (m) => m.user.toString() !== userId.toString()
        );

        await workspace.save();
        res.status(200).json({ message: 'You have left the workspace.' });

    } catch (error) {
        res.status(500).json({ message: 'Server error leaving workspace.' });
    }
};
module.exports = {
    createWorkspace,
    getWorkspaces,
    inviteMember,
    removeMember,
    updateMemberRole,
    deleteWorkspace,
    leaveWorkspace,
};