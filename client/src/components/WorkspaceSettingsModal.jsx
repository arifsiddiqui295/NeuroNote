import React, { useState } from 'react';
import workspaceService from '../api/workspaceApi';
import Modal from './Modal';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function WorkspaceSettingsModal({ isOpen, onClose, workspace, onUpdate }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    if (!workspace) return null;

    const isOwner = workspace.owner._id === user._id;
    const myRole = workspace.members.find(m => m.user._id === user._id)?.role || 'viewer';
    const isAdmin = myRole === 'admin';

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedMembers = await workspaceService.inviteMember(workspace._id, inviteEmail, inviteRole);
            onUpdate({ ...workspace, members: updatedMembers });
            setInviteEmail('');
            toast.success('Member invited!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to invite.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (memberId) => {
        setConfirmMessage(`Are you sure you want to remove this member?`);
        setConfirmAction(() => async () => {
            await workspaceService.removeMember(workspace._id, memberId);
            await onUpdate();
            toast.success('Member removed.');
        });
        setIsConfirmModalOpen(true);
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            const updatedMembers = await workspaceService.updateMemberRole(workspace._id, memberId, newRole);
            onUpdate({ ...workspace, members: updatedMembers });
            toast.success('Role updated.');
        } catch (err) {
            toast.error('Failed to update role.');
        }
    };

    const handleLeave = () => {
        setConfirmMessage(`Are you sure you want to leave this workspace?`);
        setConfirmAction(() => async () => {
            await workspaceService.leaveWorkspace(workspace._id);
            toast.success('Left workspace.');
            navigate('/dashboard');
        });
        setIsConfirmModalOpen(true);
    };

    const handleDeleteWorkspace = () => {
        setConfirmMessage(`WARNING: This will delete the workspace (${workspace.name}) and ALL lessons/notes inside it. This cannot be undone. Are you absolutely sure?`);
        setConfirmAction(() => async () => {
            await workspaceService.deleteWorkspace(workspace._id);
            toast.success('Workspace deleted.');
            navigate('/dashboard');
        });
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        if (!confirmAction) return;
        setIsSubmitting(true);
        try {
            await confirmAction();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
            setIsConfirmModalOpen(false);
            setConfirmAction(null);
            setConfirmMessage('');
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <h2 className="text-2xl font-bold text-white mb-4">{workspace.name} Settings</h2>

                {isAdmin && (
                    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Invite New Member</h3>
                        <form onSubmit={handleInvite} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-2">
                            <input
                                type="email"
                                placeholder="User Email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="sm:col-span-2 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                                required
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                // Reduced padding for select box
                                className="p-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button type="submit" disabled={loading} className="sm:col-span-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                Add
                            </button>
                        </form>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Members</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {workspace.members.map((member) => (
                            <div key={member.user._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-700 rounded">
                                <span className="text-gray-200 truncate pr-2 w-full sm:w-auto">
                                    {member.user._id === user._id ? 'You' : `${member.user.username} (${member.user.email})`}
                                    {workspace.owner._id === member.user._id && <span className="text-yellow-400 text-xs ml-2 font-bold">(Owner)</span>}
                                </span>

                                <div className="flex items-center gap-2 mt-1 sm:mt-0 min-w-min">
                                    {isAdmin && member.user._id !== user._id && workspace.owner._id !== member.user._id ? (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                                                className="p-1.5 bg-gray-700 text-xs text-white rounded-lg border border-gray-600 capitalize"
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button
                                                onClick={() => handleRemove(member.user._id)}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-600 pt-4 flex justify-between">
                    {!isOwner && (
                        <button onClick={handleLeave} className="text-red-400 hover:text-red-300 text-sm">
                            Leave Workspace
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={handleDeleteWorkspace} className="text-red-500 hover:text-red-400 text-sm font-bold">
                            Delete Workspace
                        </button>
                    )}
                </div>
            </Modal>



            {/* --- CONFIRMATION MODAL --- */}
            <Modal isOpen={isConfirmModalOpen} onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}>
                <h3 className="text-2xl font-bold text-red-400 mb-2">Are you sure?</h3>
                <p className="text-gray-300 mb-6">{confirmMessage}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={() => setIsConfirmModalOpen(false)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={executeAction}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Yes, Proceed'}
                    </button>
                </div>
            </Modal>
        </>
    );
}