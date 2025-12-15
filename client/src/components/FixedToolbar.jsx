import React, { useState, useEffect, useRef } from 'react';

export default function FixedToolbar({ editor }) {
  if (!editor) return null;

  const [showColors, setShowColors] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColors && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowColors(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColors]);

  // --- NEW: Undo / Redo Functions ---
  const undo = () => editor.undo();
  const redo = () => editor.redo();

  const toggleBold = () => editor.toggleStyles({ bold: true });
  const toggleItalic = () => editor.toggleStyles({ italic: true });
  const toggleUnderline = () => editor.toggleStyles({ underline: true });
  const toggleStrike = () => editor.toggleStyles({ strike: true });

  const setBlockType = (type, level) => {
    const selection = editor.getSelection();
    const blocksToUpdate = selection ? selection.blocks : [editor.getTextCursorPosition().block];

    const isActive = blocksToUpdate.every(
      (block) => block.type === type && (!level || block.props.level === level)
    );

    const targetType = isActive ? "paragraph" : type;
    const targetProps = isActive ? {} : { level: level };

    blocksToUpdate.forEach((block) => {
      editor.updateBlock(block, { type: targetType, props: targetProps });
    });
    
    editor.focus();
  };

  const setTextColor = (color) => editor.toggleStyles({ textColor: color });
  const setBackgroundColor = (color) => editor.toggleStyles({ backgroundColor: color });

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 p-2 bg-[#1F1F1F] text-gray-200 border-b border-gray-700">
      {/* Headings Group */}
      <div className="flex gap-1 bg-gray-700 rounded p-1 shrink-0">
          <button onClick={() => setBlockType("paragraph")} className="p-1 px-2 hover:bg-gray-600 rounded text-sm">P</button>
          <button onClick={() => setBlockType("heading", 1)} className="p-1 px-2 hover:bg-gray-600 rounded text-sm font-bold">H1</button>
          <button onClick={() => setBlockType("heading", 2)} className="p-1 px-2 hover:bg-gray-600 rounded text-sm font-bold">H2</button>
          <button onClick={() => setBlockType("heading", 3)} className="p-1 px-2 hover:bg-gray-600 rounded text-sm font-bold">H3</button>
      </div>
      
      <div className="hidden sm:block w-px h-6 bg-gray-600 mx-1"></div>

      {/* Formatting Group */}
      <div className="flex gap-1 shrink-0">
          <button onClick={toggleBold} className="p-1 px-2 hover:bg-gray-700 rounded font-bold hover:text-white">B</button>
          <button onClick={toggleItalic} className="p-1 px-2 hover:bg-gray-700 rounded italic hover:text-white">I</button>
          <button onClick={toggleUnderline} className="p-1 px-2 hover:bg-gray-700 rounded underline hover:text-white">U</button>
          <button onClick={toggleStrike} className="p-1 px-2 hover:bg-gray-700 rounded line-through hover:text-white">S</button>
      </div>

      <div className="hidden sm:block w-px h-6 bg-gray-600 mx-1"></div>

      {/* Lists Group */}
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setBlockType("bulletListItem")} className="p-1 px-2 hover:bg-gray-700 rounded hover:text-white" title="Bullet List">• List</button>
        <button onClick={() => setBlockType("numberedListItem")} className="p-1 px-2 hover:bg-gray-700 rounded hover:text-white" title="Numbered List">1. List</button>
      </div>

      <div className="hidden sm:block w-px h-6 bg-gray-600 mx-1"></div>

      {/* Colors Dropdown Toggle */}
      <div className="relative shrink-0" ref={menuRef}>
          <button 
            onClick={() => setShowColors(!showColors)} 
            className="p-1 px-2 hover:bg-gray-700 rounded flex items-center gap-1 text-sm hover:text-white"
          >
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-blue-500"></span>
            Colors
          </button>

          {/* Colors Popup */}
          {showColors && (
              <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-600 rounded shadow-xl p-2 w-48 flex flex-col gap-2 z-[100]">
                 <div className="text-xs text-gray-400 uppercase font-bold">Text</div>
                 <div className="flex gap-1 justify-between flex-wrap">
                    <button onClick={() => setTextColor("default")} className="w-6 h-6 rounded bg-white border border-gray-500" title="Default"></button>
                    <button onClick={() => setTextColor("red")} className="w-6 h-6 rounded bg-red-500" title="Red"></button>
                    <button onClick={() => setTextColor("orange")} className="w-6 h-6 rounded bg-orange-500" title="Orange"></button>
                    <button onClick={() => setTextColor("yellow")} className="w-6 h-6 rounded bg-yellow-500" title="Yellow"></button>
                    <button onClick={() => setTextColor("blue")} className="w-6 h-6 rounded bg-blue-500" title="Blue"></button>
                    <button onClick={() => setTextColor("purple")} className="w-6 h-6 rounded bg-purple-500" title="Purple"></button>
                 </div>
                 <div className="text-xs text-gray-400 uppercase font-bold mt-1">Highlight</div>
                 <div className="flex gap-1 justify-between flex-wrap">
                    <button 
                       onClick={() => setBackgroundColor("default")} 
                       className="w-6 h-6 rounded bg-[#1F1F1F] border border-gray-500 flex items-center justify-center" 
                       title="No Highlight"
                    >
                       <span className="text-gray-400 text-xs">✕</span>
                    </button>
                    <button onClick={() => setBackgroundColor("red")} className="w-6 h-6 rounded bg-red-900 border border-red-700" title="Red"></button>
                    <button onClick={() => setBackgroundColor("blue")} className="w-6 h-6 rounded bg-blue-900 border border-blue-700" title="Blue"></button>
                    <button onClick={() => setBackgroundColor("green")} className="w-6 h-6 rounded bg-green-900 border border-green-700" title="Green"></button>
                    <button onClick={() => setBackgroundColor("yellow")} className="w-6 h-6 rounded bg-yellow-900 border border-yellow-700" title="Yellow"></button>
                 </div>
              </div>
          )}
      </div>
    </div>
  );
}