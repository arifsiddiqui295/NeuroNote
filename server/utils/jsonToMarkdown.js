const jsonToMarkdown = (content) => {
    if (!Array.isArray(content)) return '';

    const processNode = (node) => {
        let markdown = '';
        const childrenMarkdown = node.children ? node.children.map(processNode).join('') : '';

        switch (node.type) {
            case 'h1':
                markdown = `# ${childrenMarkdown}\n\n`;
                break;
            case 'p':
                markdown = `${childrenMarkdown}\n\n`;
                break;
            case 'strong':
                markdown = `**${childrenMarkdown}**`;
                break;
            case 'u':
                markdown = `**${childrenMarkdown}**`;
                break;
            case 'br':
                markdown = `\n`;
                break;
            case 'text':
                markdown = node.value || '';
                break;
            case 'table':
                const rows = node.children
                    .filter(c => c.type === 'tbody' || c.type === 'thead')[0]
                    ?.children.filter(c => c.type === 'tr');

                if (!rows || rows.length === 0) break;

                const headerCells = rows[0].children.filter(c => c.type === 'th' || c.type === 'td');
                const headerContent = headerCells.map(cell => cell.children.map(processNode).join('').trim());
                markdown += `| ${headerContent.join(' | ')} |\n`;

                const separator = headerCells.map(() => '---').join(' | ');
                markdown += `| ${separator} |\n`;

                for (let i = 1; i < rows.length; i++) {
                    const bodyCells = rows[i].children.filter(c => c.type === 'td');
                    const bodyContent = bodyCells.map(cell => cell.children.map(processNode).join('').trim());
                    markdown += `| ${bodyContent.join(' | ')} |\n`;
                }
                markdown += '\n';
                break;

            default:
                markdown = childrenMarkdown;
        }
        return markdown;
    };

    return content.map(processNode).join('').trim();
};

module.exports=jsonToMarkdown;