const fs = require('fs');

const files = [
  'C:/Users/sales/Documents/Node-microservice/src/services/message.service.js',
  'C:/Users/sales/Documents/latest/aips_latest/aips/Node-microservice/src/services/message.service.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const oldPattern = /if\s*\(\s*commRows\.length\s*===\s*0\s*\)\s*\{[\s\S]*?return\s*\[\]\s*;\s*\}/;
    const replacement = `if (commRows.length === 0) {
                const groupIdentifier = \`G_\${classId}_\${sectionId || 'all'}\`;
                console.log(\`ℹ️ [MSG_SERVICE] No group thread found for: \${groupIdentifier}\`);
                return [];
            }`;
    content = content.replace(oldPattern, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated:', file);
  }
});
