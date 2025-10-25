#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const browsers = ['chrome', 'edge', 'firefox', 'safari'];

console.log('Building Browser Context Plugin for all browsers...\n');

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

browsers.forEach(browser => {
  console.log(`Building ${browser} extension...`);
  
  try {
    // Run webpack build
    execSync(`npx webpack --config webpack.${browser}.config.js`, { stdio: 'inherit' });
    
    // Copy static files
    const distDir = `dist/${browser}`;
    const sourceDir = browser === 'safari' ? 
      'safari/Browser-Context-Plugin.safariextension' : 
      browser;
    
    // Copy manifest
    if (browser === 'safari') {
      fs.copyFileSync(
        path.join(sourceDir, 'Info.plist'),
        path.join(distDir, 'Info.plist')
      );
    } else {
      fs.copyFileSync(
        path.join(sourceDir, 'manifest.json'),
        path.join(distDir, 'manifest.json')
      );
    }
    
    // Copy HTML files
    if (fs.existsSync(path.join(sourceDir, 'popup.html'))) {
      fs.copyFileSync(
        path.join(sourceDir, 'popup.html'),
        path.join(distDir, 'popup.html')
      );
    }
    
    // Copy icons directory
    if (fs.existsSync(path.join(sourceDir, 'icons'))) {
      const iconsDistDir = path.join(distDir, 'icons');
      if (!fs.existsSync(iconsDistDir)) {
        fs.mkdirSync(iconsDistDir, { recursive: true });
      }
      
      const iconFiles = fs.readdirSync(path.join(sourceDir, 'icons'));
      iconFiles.forEach(file => {
        fs.copyFileSync(
          path.join(sourceDir, 'icons', file),
          path.join(iconsDistDir, file)
        );
      });
    }
    
    // Copy shared directory
    if (fs.existsSync('shared')) {
      const sharedDistDir = path.join(distDir, 'shared');
      if (!fs.existsSync(sharedDistDir)) {
        fs.mkdirSync(sharedDistDir, { recursive: true });
      }
      
      const copyRecursive = (src, dest) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        entries.forEach(entry => {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        });
      };
      
      copyRecursive('shared', sharedDistDir);
    }
    
    console.log(`✅ ${browser} extension built successfully\n`);
    
  } catch (error) {
    console.error(`❌ Failed to build ${browser} extension:`, error.message);
    process.exit(1);
  }
});

console.log('🎉 All extensions built successfully!');
console.log('\nBuild output:');
browsers.forEach(browser => {
  console.log(`  - ${browser}: dist/${browser}/`);
});
