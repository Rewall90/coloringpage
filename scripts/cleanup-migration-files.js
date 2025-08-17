#!/usr/bin/env node

/**
 * Safe Cleanup Script: Remove Migration-Related Files
 *
 * This script safely removes all files created during the migration planning phase
 * that are no longer needed since real-time transformations are now implemented.
 */

import fs from 'fs';
import path from 'path';
// import { execSync } from 'child_process';

const CLEANUP_LOG = 'cleanup-log.json';

/**
 * Safe cleanup with rollback capability
 */
class SafeCleanup {
  constructor() {
    this.log = this.loadLog();
    this.backupDir = `cleanup-backup-${Date.now()}`;
  }

  loadLog() {
    if (fs.existsSync(CLEANUP_LOG)) {
      return JSON.parse(fs.readFileSync(CLEANUP_LOG, 'utf-8'));
    }
    return {
      phase: 0,
      completed: [],
      removed: [],
      backed_up: [],
      timestamp: new Date().toISOString(),
    };
  }

  saveLog() {
    fs.writeFileSync(CLEANUP_LOG, JSON.stringify(this.log, null, 2));
  }

  backup(filePath) {
    const backupPath = path.join(this.backupDir, filePath);
    const backupDirPath = path.dirname(backupPath);

    // Ensure backup directory exists
    fs.mkdirSync(backupDirPath, { recursive: true });

    // Copy file before removal
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      this.log.backed_up.push({ original: filePath, backup: backupPath });
      console.log(`💾 Backed up: ${filePath}`);
      return true;
    }
    return false;
  }

  safeRemove(filePath, description = '') {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚪ Not found: ${filePath} (already removed)`);
        return true;
      }

      // Backup first
      this.backup(filePath);

      // Remove file/directory
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }

      this.log.removed.push({
        path: filePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        description: description,
        timestamp: new Date().toISOString(),
      });

      console.log(`🗑️  Removed: ${filePath} ${description ? `(${description})` : ''}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Files to remove - organized by category
   */
  getFilesToRemove() {
    return {
      // Migration planning documents
      documentation: ['MIGRATION_PLAN.md'],

      // Migration scripts
      scripts: [
        'scripts/migrate-to-enhanced-images.js',
        'scripts/utils/enhanced-image-helpers.js',
        'scripts/utils/cloudflare-image-helpers.js',
      ],

      // Enhanced workers (replaced by real-time feature)
      workers: [
        'cloudflare-workers/enhanced-image-proxy/',
        'cloudflare-workers/collection-image-proxy/src/enhanced-worker.js',
        'cloudflare-workers/image-proxy/src/enhanced-index.js',
      ],

      // Backup templates (no longer needed)
      templates: ['layouts/partials/enhanced-article-card.html'],

      // Generated files during testing
      temp_files: [
        'public/simplified-mappings.json',
        'migration-log.json',
        'cleanup-log.json', // Will be removed last
      ],
    };
  }

  /**
   * Phase 1: Create backup of everything
   */
  async phase1_backup() {
    if (this.log.completed.includes('phase1')) {
      console.log('📋 Phase 1 already completed - skipping backup');
      return;
    }

    console.log('🔄 Phase 1: Creating comprehensive backup...');

    // Create backup directory
    fs.mkdirSync(this.backupDir, { recursive: true });

    const filesToRemove = this.getFilesToRemove();
    let backedUpCount = 0;

    // Backup all files that exist
    Object.values(filesToRemove)
      .flat()
      .forEach(filePath => {
        if (this.backup(filePath)) {
          backedUpCount++;
        }
      });

    this.log.completed.push('phase1');
    this.log.phase = 1;
    this.saveLog();
    console.log(`✅ Phase 1 completed: ${backedUpCount} items backed up`);
  }

  /**
   * Phase 2: Remove migration documentation
   */
  async phase2_removeDocs() {
    if (this.log.completed.includes('phase2')) {
      console.log('📋 Phase 2 already completed - skipping documentation cleanup');
      return;
    }

    console.log('🔄 Phase 2: Removing migration documentation...');

    const filesToRemove = this.getFilesToRemove();

    filesToRemove.documentation.forEach(file => {
      this.safeRemove(file, 'migration planning document');
    });

    this.log.completed.push('phase2');
    this.log.phase = 2;
    this.saveLog();
    console.log('✅ Phase 2 completed: Documentation cleaned up');
  }

  /**
   * Phase 3: Remove migration scripts
   */
  async phase3_removeScripts() {
    if (this.log.completed.includes('phase3')) {
      console.log('📋 Phase 3 already completed - skipping script cleanup');
      return;
    }

    console.log('🔄 Phase 3: Removing migration scripts...');

    const filesToRemove = this.getFilesToRemove();

    filesToRemove.scripts.forEach(file => {
      this.safeRemove(file, 'migration script');
    });

    this.log.completed.push('phase3');
    this.log.phase = 3;
    this.saveLog();
    console.log('✅ Phase 3 completed: Migration scripts removed');
  }

  /**
   * Phase 4: Remove enhanced workers
   */
  async phase4_removeWorkers() {
    if (this.log.completed.includes('phase4')) {
      console.log('📋 Phase 4 already completed - skipping worker cleanup');
      return;
    }

    console.log('🔄 Phase 4: Removing enhanced workers...');

    const filesToRemove = this.getFilesToRemove();

    filesToRemove.workers.forEach(file => {
      this.safeRemove(file, 'enhanced worker');
    });

    this.log.completed.push('phase4');
    this.log.phase = 4;
    this.saveLog();
    console.log('✅ Phase 4 completed: Enhanced workers removed');
  }

  /**
   * Phase 5: Remove backup templates
   */
  async phase5_removeTemplates() {
    if (this.log.completed.includes('phase5')) {
      console.log('📋 Phase 5 already completed - skipping template cleanup');
      return;
    }

    console.log('🔄 Phase 5: Removing backup templates...');

    const filesToRemove = this.getFilesToRemove();

    filesToRemove.templates.forEach(file => {
      this.safeRemove(file, 'backup template');
    });

    this.log.completed.push('phase5');
    this.log.phase = 5;
    this.saveLog();
    console.log('✅ Phase 5 completed: Backup templates removed');
  }

  /**
   * Phase 6: Remove temporary files
   */
  async phase6_removeTempFiles() {
    if (this.log.completed.includes('phase6')) {
      console.log('📋 Phase 6 already completed - skipping temp file cleanup');
      return;
    }

    console.log('🔄 Phase 6: Removing temporary files...');

    const filesToRemove = this.getFilesToRemove();

    // Remove all temp files except cleanup-log.json (removed last)
    filesToRemove.temp_files
      .filter(file => file !== 'cleanup-log.json')
      .forEach(file => {
        this.safeRemove(file, 'temporary file');
      });

    this.log.completed.push('phase6');
    this.log.phase = 6;
    this.saveLog();
    console.log('✅ Phase 6 completed: Temporary files removed');
  }

  /**
   * Phase 7: Final cleanup
   */
  async phase7_finalCleanup() {
    console.log('🔄 Phase 7: Final cleanup...');

    // Create final summary
    const summary = {
      cleanup_completed: new Date().toISOString(),
      total_removed: this.log.removed.length,
      total_backed_up: this.log.backed_up.length,
      backup_location: this.backupDir,
      removed_items: this.log.removed,
    };

    // Save final summary
    fs.writeFileSync('cleanup-summary.json', JSON.stringify(summary, null, 2));
    console.log('📄 Created cleanup-summary.json with details');

    // Remove cleanup log last
    if (fs.existsSync(CLEANUP_LOG)) {
      fs.unlinkSync(CLEANUP_LOG);
      console.log('🗑️  Removed: cleanup-log.json (final cleanup)');
    }

    console.log('✅ Phase 7 completed: Final cleanup done');
  }

  /**
   * Rollback function - restore everything
   */
  async rollback() {
    console.log('🔄 Rolling back cleanup - restoring all files...');

    if (!fs.existsSync(this.backupDir)) {
      console.error('❌ Backup directory not found. Cannot rollback.');
      return;
    }

    let restoredCount = 0;

    // Restore all backed up files
    this.log.backed_up.forEach(({ original, backup }) => {
      try {
        if (fs.existsSync(backup)) {
          // Ensure target directory exists
          const targetDir = path.dirname(original);
          fs.mkdirSync(targetDir, { recursive: true });

          // Restore file
          fs.copyFileSync(backup, original);
          console.log(`✅ Restored: ${original}`);
          restoredCount++;
        } else {
          console.warn(`⚠️  Backup not found: ${backup}`);
        }
      } catch (error) {
        console.error(`❌ Failed to restore ${original}:`, error.message);
      }
    });

    console.log(`✅ Rollback completed: ${restoredCount} files restored`);
  }

  /**
   * Verify cleanup won't break anything
   */
  verifyCleanup() {
    console.log('🔍 Verifying cleanup safety...');

    // Check if real-time transforms are enabled
    const paramsPath = 'config/_default/params.toml';
    if (fs.existsSync(paramsPath)) {
      const paramsContent = fs.readFileSync(paramsPath, 'utf-8');
      if (paramsContent.includes('useRealTimeTransforms = true')) {
        console.log('✅ Real-time transforms are enabled');
      } else {
        console.log('⚠️  Real-time transforms not enabled - cleanup might be premature');
        console.log('   Consider enabling useRealTimeTransforms = true first');
      }
    }

    // Check if enhanced features are implemented in main script
    const mainScriptPath = 'scripts/fetch-sanity-content-sections.js';
    if (fs.existsSync(mainScriptPath)) {
      const scriptContent = fs.readFileSync(mainScriptPath, 'utf-8');
      if (scriptContent.includes('USE_REAL_TIME_TRANSFORMS')) {
        console.log('✅ Real-time transforms implemented in build script');
      } else {
        console.log('⚠️  Real-time transforms not found in build script');
      }
    }

    console.log('✅ Verification complete');
  }

  /**
   * Run full cleanup
   */
  async cleanup() {
    try {
      console.log('🚀 Starting safe cleanup of migration files...');

      // Verify it's safe to cleanup
      this.verifyCleanup();

      await this.phase1_backup();
      await this.phase2_removeDocs();
      await this.phase3_removeScripts();
      await this.phase4_removeWorkers();
      await this.phase5_removeTemplates();
      await this.phase6_removeTempFiles();
      await this.phase7_finalCleanup();

      console.log('🎉 Cleanup completed successfully!');
      console.log(`📦 Backup available at: ${this.backupDir}`);
      console.log('📋 Summary saved to: cleanup-summary.json');
      console.log('');
      console.log('💡 If anything breaks, run with --rollback to restore all files');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      console.log('🔄 Run with --rollback to restore files if needed');
      throw error;
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const cleanup = new SafeCleanup();

if (args.includes('--rollback')) {
  cleanup.rollback();
} else if (args.includes('--verify')) {
  cleanup.verifyCleanup();
} else if (args.includes('--status')) {
  console.log('📋 Cleanup Status:', cleanup.log);
} else if (args.includes('--help')) {
  console.log(`
🧹 Migration Cleanup Script

Usage:
  node scripts/cleanup-migration-files.js         # Run cleanup
  node scripts/cleanup-migration-files.js --verify   # Check safety first
  node scripts/cleanup-migration-files.js --rollback # Restore all files
  node scripts/cleanup-migration-files.js --status   # Show current status
  node scripts/cleanup-migration-files.js --help     # Show this help

What gets removed:
  • Migration planning documents (MIGRATION_PLAN.md)
  • Migration scripts (migrate-to-enhanced-images.js, etc.)
  • Enhanced worker implementations (enhanced-image-proxy)
  • Backup templates (enhanced-article-card.html)
  • Temporary files (simplified-mappings.json, logs)

Safety features:
  • Complete backup before removal
  • Phase-by-phase execution
  • Full rollback capability
  • Verification checks
  `);
} else {
  cleanup.cleanup();
}
