const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');

// Fix apostrophes in text (not in JSX attributes)
let fixed = content
  .replace(/ZZP'ers/g, "ZZP&apos;ers")
  .replace(/ je '/g, " je &apos;")
  .replace(/m'n /g, "m&apos;n ");

// Fix quotes in testimonials and FAQ - only within <p> tags
fixed = fixed.replace(/<p className="text-sm mb-4">\s*"([^"]+)"\s*<\/p>/g, 
  '<p className="text-sm mb-4">\n                  &ldquo;$1&rdquo;\n                </p>');

fs.writeFileSync('app/page.tsx', fixed);
console.log('Fixed quotes!');
