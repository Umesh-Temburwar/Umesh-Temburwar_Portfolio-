const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
content = content.replace("import { useLocation, Link } from 'react-router-dom';", 
`import { useLocation, Link, Routes, Route } from 'react-router-dom';
import Projects from './pages/Projects';
import Resume from './pages/Resume';
import Contact from './pages/Contact';`);

// Remove unused state variables (sendEmail logic)
content = content.replace(/  const \[isSubmitting, setIsSubmitting\].*?setSubmitStatus\('error'\);\n      \}\)\n      \.finally\(\(\) => setIsSubmitting\(false\)\);\n  \};\n/s, '');

// Wrap <main> with <Routes>
content = content.replace("<main>\n          {showHomeContent && (\n            <>",
`<main>
          <Routes>
            <Route path="/" element={
              <>`);

// Replace the end of home content and the rest of main with Route closing and other Routes
const endOfHomeIndex = content.indexOf('          {/* PROJECTS SECTION */}');
const endOfMainIndex = content.indexOf('        </main>');

if (endOfHomeIndex > -1 && endOfMainIndex > -1) {
  // We need to remove the closing `</>\n          )}` from the original home content, which is right before `          {/* PROJECTS SECTION */}`
  
  const beforeSection = content.substring(0, endOfHomeIndex);
  // find the last occurrence of `</>\n          )}`
  const cleanBeforeSection = beforeSection.replace(/            <\/>\r?\n          \)\}\r?\n\r?\n$/s, '');

  const replacement = `            </>
            } />
            <Route path="/projects" element={<Projects />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>\n`;
  content = cleanBeforeSection + replacement + content.substring(endOfMainIndex);
}

fs.writeFileSync('src/App.tsx', content);
console.log('Refactored App.tsx successfully');
