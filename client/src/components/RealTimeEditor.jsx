import React, { useEffect, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { useRoom, useSelf } from "@liveblocks/react/suspense";
import uploadService from "../api/uploadApi";
import FixedToolbar from "./FixedToolbar";
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

export default function RealTimeEditor({ initialContent, onEditorReady, onChange, currentUser, readOnly }) {
    const room = useRoom();
    const [collabProvider, setCollabProvider] = useState(null);
    const [isSynced, setIsSynced] = useState(false); // NEW: Track sync status

    // 1. Setup Provider
    useEffect(() => {
        const doc = new Y.Doc();
        const provider = new LiveblocksYjsProvider(room, doc);

        // 1. The Sync Listener (The Happy Path)
        // If connection is fast, this fires quickly
        provider.on("synced", () => {
            setIsSynced(true);
        });

        // 2. The Timeout Failsafe (The Poor Connection Path)
        // If we haven't synced in 2.5 seconds, stop waiting and let the user edit.
        const timeoutId = setTimeout(() => {
            setIsSynced((prev) => {
                if (!prev) {
                    console.warn("Sync timed out - forcing editor load");
                    return true;
                }
                return prev;
            });
        }, 2500);

        setCollabProvider({ doc, provider });

        return () => {
            clearTimeout(timeoutId); 
            doc.destroy();
            provider.destroy();
        };
    }, [room.id]);

    // 2. Wait for EVERYTHING to be ready
    if (!collabProvider || !currentUser || !isSynced) {
        return (
            <div className="bg-gray-800 w-full rounded-lg p-6 min-h-[70vh] animate-pulse">
                {/* Fake Title/Header area */}
                <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>

                {/* Fake Paragraphs */}
                <div className="space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    return (
        <EditorInstance
            provider={collabProvider.provider}
            doc={collabProvider.doc}
            initialContent={initialContent}
            onEditorReady={onEditorReady}
            onChange={onChange}
            currentUser={currentUser}
            readOnly={readOnly}
        />
    );
}

function EditorInstance({ provider, doc, initialContent, onEditorReady, onChange, currentUser, readOnly }) {
    const editor = useCreateBlockNote({
        collaboration: {
            provider,
            fragment: doc.getXmlFragment("document-store"),
            user: {
                name: currentUser.username,
                color: stringToColor(currentUser.username),
            },
        },
        uploadFile: async (file) => {
            try {
                const res = await uploadService.uploadImage(file);
                return res.imageUrl;
            } catch (err) {
                return "";
            }
        },
    });


    
    // Force Update User Info
    useEffect(() => {
        if (provider.awareness && currentUser) {
            provider.awareness.setLocalStateField('user', {
                name: currentUser.username,
                color: stringToColor(currentUser.username)
            });
        }
    }, [provider, currentUser]);

    // Lock Editor
    useEffect(() => {
        if (editor) editor.isEditable = !readOnly;
    }, [editor, readOnly]);

    // Auto-Save Hook
    useEffect(() => {
        if (editor && onChange) {
            return editor.onEditorContentChange(() => onChange(editor));
        }
    }, [editor, onChange]);

    // Pass editor up
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Initial Load - NOW SAFE because we are Synced
    useEffect(() => {
        if (editor && initialContent) {
            const fragment = doc.getXmlFragment("document-store");
            // If Yjs is empty, load our DB content
            if (fragment.length === 0) {
                const load = async () => {
                    try {
                        if (Array.isArray(initialContent)) {
                            editor.replaceBlocks(editor.document, initialContent);
                        } else if (typeof initialContent === 'string') {
                            const blocks = await editor.tryParseHTMLToBlocks(initialContent);
                            editor.replaceBlocks(editor.document, blocks);
                        }
                    } catch (e) { }
                };
                load();
            }
        }
    }, [editor]); // Run once on mount

    return (
        <div className="bg-gray-800 w-full rounded-lg min-h-[70vh] text-gray-900 cursor-text relative flex flex-col">

            {/* ADD THIS: CSS Override for BlockNote's default "Paper" margins */}
            <style>{`
                /* Mobile specific override */
                @media (max-width: 640px) {
                    .bn-editor {
                        padding-inline: 20px !important; /* Mobile padding */
                    }
                }
            `}</style>

            {/* Toolbar */}
            {!readOnly && (
                <div className="sticky top-16 z-40 bg-gray-800 rounded-t-lg border-b border-gray-700">
                    <FixedToolbar editor={editor} />
                </div>
            )}

            {/* Editor Area */}
            {/* CHANGE: p-1 -> p-0 (Let the internal padding handle spacing) */}
            <div className="p-0 flex-grow bg-[#1F1F1F] rounded-b-lg overflow-hidden">
                <BlockNoteView editor={editor} theme="dark" />
            </div>
        </div>
    );
}