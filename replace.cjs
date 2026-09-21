const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.vue')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const vueFiles = walkSync('src/views').concat(walkSync('src/components'));

vueFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace store imports
  content = content.replace(/import\s+\{\s*useAuthStore\s*\}\s+from\s+['"].*?store\/authStore['"]/g, "import { useAuthStore } from '../mockStores'");
  content = content.replace(/import\s+\{\s*useLedgerStore\s*\}\s+from\s+['"].*?store\/ledgerStore['"]/g, "import { useLedgerStore } from '../mockStores'");
  
  // App.vue is in src/ so it would be ./mockStores
  // But wait, the files we are processing are in src/views and src/components, so ../mockStores is correct.

  fs.writeFileSync(file, content);
});

// For App.vue
let appVuePath = 'src/App.vue';
if (fs.existsSync(appVuePath)) {
  let appContent = fs.readFileSync(appVuePath, 'utf8');
  appContent = appContent.replace(/import\s+\{\s*useAuthStore\s*\}\s+from\s+['"].*?store\/authStore['"]/g, "import { useAuthStore } from './mockStores'");
  appContent = appContent.replace(/import\s+\{\s*useLedgerStore\s*\}\s+from\s+['"].*?store\/ledgerStore['"]/g, "import { useLedgerStore } from './mockStores'");
  fs.writeFileSync(appVuePath, appContent);
}

// For router
let routerPath = 'src/router/index.ts';
if (fs.existsSync(routerPath)) {
  let routerContent = fs.readFileSync(routerPath, 'utf8');
  routerContent = routerContent.replace(/import\s+\{\s*useAuthStore\s*\}\s+from\s+['"].*?store\/authStore['"]/g, "import { useAuthStore } from '../mockStores'");
  
  // Strip router guards completely
  // We can just find router.beforeEach and remove it. But regexing that is hard.
  // We'll replace router.beforeEach with a dummy or let the manual do it.
  fs.writeFileSync(routerPath, routerContent);
}

console.log("Replaced imports in " + vueFiles.length + " files.");
