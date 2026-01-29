// scripts/fixFilePaths.js
require('dotenv').config({ path: './config/config.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const File = require('../models/file.model');
const { normalizePath } = require('../middlewares/uploadFiles');

async function fixExistingFilePaths() {
    try {
        await connectDB();
        
        console.log('🔧 Starting to fix file paths...');
        
        // Get all files
        const files = await File.find({});
        
        let fixedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const file of files) {
            try {
                const oldPath = file.path;
                
                // Skip if path is already correct (relative path without drive letter)
                if (oldPath && !oldPath.includes(':') && !oldPath.startsWith('/') && !oldPath.includes('\\uploads\\')) {
                    // Path looks like "pdfs/filename.pdf"
                    skippedCount++;
                    continue;
                }
                
                const normalizedPath = normalizePath(oldPath);
                
                if (normalizedPath && normalizedPath !== oldPath) {
                    file.path = normalizedPath;
                    
                    // Update URL
                    file.url = `/uploads/${normalizedPath}`;
                    
                    await file.save();
                    fixedCount++;
                    
                    console.log(`✅ Fixed: ${oldPath} → ${normalizedPath}`);
                } else {
                    skippedCount++;
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error fixing file ${file._id}:`, error.message);
            }
        }
        
        console.log('\n📊 Results:');
        console.log(`✅ Fixed: ${fixedCount} files`);
        console.log(`⏭️ Skipped: ${skippedCount} files`);
        console.log(`❌ Errors: ${errorCount} files`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
fixExistingFilePaths();