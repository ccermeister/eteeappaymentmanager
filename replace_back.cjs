const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.vue') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const vueFiles = walkSync('src/views').concat(walkSync('src/components')).concat(['src/router/index.ts', 'src/App.vue']);

vueFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace mock store imports with real store imports
  content = content.replace(/import\s+\{\s*useAuthStore\s*\}\s+from\s+['"].*?mockStores['"]/g, "import { useAuthStore } from '../store/authStore'");
  content = content.replace(/import\s+\{\s*useLedgerStore\s*\}\s+from\s+['"].*?mockStores['"]/g, "import { useLedgerStore } from '../store/ledgerStore'");
  
  fs.writeFileSync(file, content);
});

console.log("Replaced imports to point to real stores in " + vueFiles.length + " files.");
