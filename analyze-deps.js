const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const tasksDir = './tasks';
const formats = {
  withMd: [],
  withoutMd: [],
  tskRefs: [],
  other: []
};

fs.readdirSync(tasksDir).forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(tasksDir, file), 'utf8');
    const { data } = matter(content);
    if (data.dependencies && data.dependencies.length > 0) {
      data.dependencies.forEach(dep => {
        if (dep.endsWith('.md')) {
          formats.withMd.push({ task: file, dep });
        } else if (dep.startsWith('TSK-')) {
          formats.tskRefs.push({ task: file, dep });
        } else if (/^[a-z0-9-]+$/.test(dep)) {
          formats.withoutMd.push({ task: file, dep });
        } else {
          formats.other.push({ task: file, dep });
        }
      });
    }
  }
});

console.log('\nDependency Format Analysis:\n');

console.log('Dependencies with .md extension:');
formats.withMd.forEach(({ task, dep }) => console.log(`  ${task} -> ${dep}`));

console.log('\nDependencies without .md extension:');
formats.withoutMd.forEach(({ task, dep }) => console.log(`  ${task} -> ${dep}`));

console.log('\nDependencies using TSK refs:');
formats.tskRefs.forEach(({ task, dep }) => console.log(`  ${task} -> ${dep}`));

console.log('\nOther dependency formats:');
formats.other.forEach(({ task, dep }) => console.log(`  ${task} -> ${dep}`)); 