import fs from 'fs';
import https from 'https';

const icons = [
  'github',
  'x',
  'youtube',
  'instagram',
  'leetcode',
  'hackerrank',
  'codechef',
  'geeksforgeeks',
  'stackoverflow',
  'kaggle',
  'devdotto', // DEV
  'medium',
  'coursera',
  'udemy'
];

const fetchIcon = (name) => {
  return new Promise((resolve) => {
    https.get(`https://unpkg.com/simple-icons@13.14.1/icons/${name}.svg`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
};

(async () => {
  let tsx = `import React from 'react';\n\n`;
  for (const name of icons) {
    const svg = await fetchIcon(name);
    // extract path
    const match = svg.match(/<path d="([^"]+)"/);
    if (match) {
      const path = match[1];
      const componentName = name.charAt(0).toUpperCase() + name.slice(1).replace(/dotto/, '');
      tsx += `export const Icon${componentName} = ({ className = "" }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="${path}" />
  </svg>
);\n\n`;
    }
  }
  fs.mkdirSync('src/components/icons', { recursive: true });
  fs.writeFileSync('src/components/icons/BrandIcons.tsx', tsx);
  console.log('Done!');
})();
