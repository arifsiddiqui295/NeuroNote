const Workspace = require('../models/Workspace');

// This middleware checks if a user is a member of a workspace
const checkWorkspaceMembership = async (req, res, next) => {
    try {
        let workspaceId;

        // Find the workspaceId from params, body, or query
        if (req.params.workspaceId) {
            workspaceId = req.params.workspaceId;
        } else if (req.body.workspaceId) {
            workspaceId = req.body.workspaceId;
        } else {
            // If we can't find it, we can't check permissions
            return res.status(400).json({ message: 'Workspace ID is required.' });
        }

        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }

        // Check if the user is in the members list
        const member = workspace.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member) {
            return res.status(403).json({ message: 'You are not a member of this workspace.' });
        }

        // Attach the member's role to the request for other controllers to use
        req.memberRole = member.role;
        next();

    } catch (error) {
        res.status(500).json({ message: 'Permission check failed.' });
    }
};

module.exports = { checkWorkspaceMembership };