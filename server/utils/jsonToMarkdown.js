const jsonToMarkdown = (data) => {
    // 1. Handle Strings (HTML or Plain Text)
    if (typeof data === 'string') return data;

    // 2. Recursive Text Extraction
    // This function hunts for "text" fields in any JSON structure (BlockNote, Quill, etc.)
    let extractedText = "";
    
    const extract = (item) => {
        if (!item) return;
        
        if (Array.isArray(item)) {
            item.forEach(extract);
            return;
        }

        if (typeof item === 'object') {
            // Add newlines for block elements to keep formatting clean
            if (item.type === 'paragraph' || item.type === 'heading' || item.type === 'p' || item.type === 'h1') {
                extractedText += "\n\n"; 
            }
            if (item.type === 'bulletListItem' || item.type === 'li') {
                extractedText += "\n- ";
            }

            // Found a text property? Add it.
            if (item.text) {
                extractedText += item.text;
            }
            // Old format uses 'value' for text nodes
            if (item.value) {
                extractedText += item.value;
            }
            
            // Recurse into content/children arrays
            if (item.content) extract(item.content);
            if (item.children) extract(item.children);
        }
    };

    extract(data);
    return extractedText.trim();
};

module.exports = jsonToMarkdown;