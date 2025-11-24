/**
 * Data Storage Monitoring Service
 * Monitors Supabase storage usage and alerts when approaching limits
 */

import { supabase } from '../config/supabase.js';
import { sendEmail } from './email.js';
import { logger } from './logger.js';

interface StorageStats {
  totalSize: number; // Total storage used in bytes
  fileCount: number; // Total number of files
  buckets: Record<string, {
    size: number;
    count: number;
  }>;
  timestamp: Date;
}

interface StorageConfig {
  enabled: boolean;
  warningThresholdPercent: number; // Alert at this % of quota
  criticalThresholdPercent: number; // Critical alert at this % of quota
  quotaBytes: number; // Storage quota in bytes (100GB default for Supabase free tier)
  checkIntervalMinutes: number; // How often to check
  alertEmail?: string;
}

// Default configuration
const DEFAULT_CONFIG: StorageConfig = {
  enabled: process.env.STORAGE_MONITORING_ENABLED === 'true',
  warningThresholdPercent: parseInt(process.env.STORAGE_WARNING_THRESHOLD || '80'),
  criticalThresholdPercent: parseInt(process.env.STORAGE_CRITICAL_THRESHOLD || '95'),
  quotaBytes: parseInt(process.env.STORAGE_QUOTA_BYTES || String(100 * 1024 * 1024 * 1024)), // 100GB
  checkIntervalMinutes: parseInt(process.env.STORAGE_CHECK_INTERVAL || '60'), // Every hour
  alertEmail: process.env.STORAGE_ALERT_EMAIL || process.env.ANOMALY_ALERT_EMAIL,
};

// Cache for last alert to prevent spam
let lastWarningAlertTime: Date | null = null;
let lastCriticalAlertTime: Date | null = null;
const ALERT_COOLDOWN_HOURS = 24; // Only alert once per day

/**
 * Get storage statistics from Supabase
 */
export async function getStorageStats(): Promise<StorageStats> {
  try {
    // Note: Supabase doesn't provide direct storage metrics via SDK
    // This is a placeholder implementation that would need Supabase API access
    // In production, you'd use Supabase Dashboard API or database queries

    // Get approximate storage from database
    const stats: StorageStats = {
      totalSize: 0,
      fileCount: 0,
      buckets: {},
      timestamp: new Date(),
    };

    // Query storage.objects table if available
    try {
      const { data: objects, error } = await supabase
        .from('objects')
        .select('bucket_id, metadata')
        .limit(10000); // Limit for performance

      if (!error && objects) {
        objects.forEach((obj: any) => {
          const bucket = obj.bucket_id || 'unknown';
          const size = obj.metadata?.size || 0;

          if (!stats.buckets[bucket]) {
            stats.buckets[bucket] = { size: 0, count: 0 };
          }

          stats.buckets[bucket].size += size;
          stats.buckets[bucket].count += 1;
          stats.totalSize += size;
          stats.fileCount += 1;
        });
      }
    } catch (error) {
      logger.warn('Could not fetch storage objects:', error);
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get storage stats:', error as Error);
    throw error;
  }
}

/**
 * Check storage usage and alert if needed
 */
export async function checkStorageUsage(): Promise<{
  usage: StorageStats;
  alerts: string[];
}> {
  try {
    const config = DEFAULT_CONFIG;
    const stats = await getStorageStats();
    const alerts: string[] = [];

    if (!config.enabled) {
      return { usage: stats, alerts };
    }

    // Calculate usage percentage
    const usagePercent = (stats.totalSize / config.quotaBytes) * 100;

    logger.debug(`Storage usage: ${formatBytes(stats.totalSize)} / ${formatBytes(config.quotaBytes)} (${usagePercent.toFixed(2)}%)`);

    // Check critical threshold
    if (usagePercent >= config.criticalThresholdPercent) {
      const shouldAlert = !lastCriticalAlertTime ||
        (Date.now() - lastCriticalAlertTime.getTime()) > ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;

      if (shouldAlert) {
        await sendCriticalStorageAlert(stats, usagePercent, config);
        lastCriticalAlertTime = new Date();
        alerts.push(`CRITICAL: Storage at ${usagePercent.toFixed(1)}%`);
      }
    }
    // Check warning threshold
    else if (usagePercent >= config.warningThresholdPercent) {
      const shouldAlert = !lastWarningAlertTime ||
        (Date.now() - lastWarningAlertTime.getTime()) > ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;

      if (shouldAlert) {
        await sendWarningStorageAlert(stats, usagePercent, config);
        lastWarningAlertTime = new Date();
        alerts.push(`WARNING: Storage at ${usagePercent.toFixed(1)}%`);
      }
    }

    return { usage: stats, alerts };
  } catch (error) {
    logger.error('Storage usage check failed:', error as Error);
    return {
      usage: {
        totalSize: 0,
        fileCount: 0,
        buckets: {},
        timestamp: new Date(),
      },
      alerts: ['Error checking storage'],
    };
  }
}

/**
 * Send warning storage alert
 */
async function sendWarningStorageAlert(
  stats: StorageStats,
  usagePercent: number,
  config: StorageConfig
): Promise<void> {
  const message = `
⚠️ Storage Usage Warning

Current Usage: ${formatBytes(stats.totalSize)} (${usagePercent.toFixed(1)}%)
Quota: ${formatBytes(config.quotaBytes)}
Files: ${stats.fileCount.toLocaleString()}

Threshold: ${config.warningThresholdPercent}%

Action Recommended:
1. Review and clean up old files
2. Consider increasing storage quota
3. Monitor usage trends

Bucket Breakdown:
${Object.entries(stats.buckets).map(([bucket, data]) =>
    `- ${bucket}: ${formatBytes(data.size)} (${data.count} files)`
  ).join('\n')}
  `.trim();

  if (config.alertEmail) {
    try {
      await sendEmail({
        to: config.alertEmail,
        subject: '⚠️ Petflix - Storage Usage Warning',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #856404;">⚠️ Storage Usage Warning</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h3>Current Usage</h3>
              <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <div style="font-size: 32px; font-weight: bold; color: #ffc107;">${usagePercent.toFixed(1)}%</div>
                <div style="color: #666;">${formatBytes(stats.totalSize)} / ${formatBytes(config.quotaBytes)}</div>
                <div style="color: #666;">${stats.fileCount.toLocaleString()} files</div>
              </div>

              <h3>Bucket Breakdown</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(stats.buckets).map(([bucket, data]) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${bucket}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatBytes(data.size)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${data.count} files</td>
                  </tr>
                `).join('')}
              </table>

              <h3 style="margin-top: 20px;">Action Recommended</h3>
              <ol>
                <li>Review and clean up old files</li>
                <li>Consider increasing storage quota</li>
                <li>Monitor usage trends</li>
              </ol>
            </div>
          </div>
        `,
      });

      logger.info(`Storage warning alert sent to ${config.alertEmail}`);
    } catch (error) {
      logger.error('Failed to send storage warning email:', error as Error);
    }
  }

  logger.warn(message);
}

/**
 * Send critical storage alert
 */
async function sendCriticalStorageAlert(
  stats: StorageStats,
  usagePercent: number,
  config: StorageConfig
): Promise<void> {
  const message = `
🚨 CRITICAL: Storage Usage Critical!

Current Usage: ${formatBytes(stats.totalSize)} (${usagePercent.toFixed(1)}%)
Quota: ${formatBytes(config.quotaBytes)}
Files: ${stats.fileCount.toLocaleString()}

Threshold: ${config.criticalThresholdPercent}%

IMMEDIATE ACTION REQUIRED:
1. Clean up old/unused files NOW
2. Increase storage quota
3. Investigate unusual uploads

Bucket Breakdown:
${Object.entries(stats.buckets).map(([bucket, data]) =>
    `- ${bucket}: ${formatBytes(data.size)} (${data.count} files)`
  ).join('\n')}
  `.trim();

  if (config.alertEmail) {
    try {
      await sendEmail({
        to: config.alertEmail,
        subject: '🚨 CRITICAL: Petflix Storage Nearly Full!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fee; border-left: 4px solid #f00; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #c00;">🚨 CRITICAL: Storage Nearly Full!</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h3>Current Usage</h3>
              <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 2px solid #f00;">
                <div style="font-size: 32px; font-weight: bold; color: #f00;">${usagePercent.toFixed(1)}%</div>
                <div style="color: #666;">${formatBytes(stats.totalSize)} / ${formatBytes(config.quotaBytes)}</div>
                <div style="color: #666;">${stats.fileCount.toLocaleString()} files</div>
              </div>

              <h3>Bucket Breakdown</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(stats.buckets).map(([bucket, data]) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${bucket}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatBytes(data.size)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${data.count} files</td>
                  </tr>
                `).join('')}
              </table>

              <h3 style="margin-top: 20px; color: #c00;">IMMEDIATE ACTION REQUIRED</h3>
              <ol>
                <li><strong>Clean up old/unused files NOW</strong></li>
                <li><strong>Increase storage quota</strong></li>
                <li><strong>Investigate unusual uploads</strong></li>
              </ol>

              <div style="background: #fee; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <strong>⚠️ Warning:</strong> Service may be disrupted if storage quota is exceeded.
              </div>
            </div>
          </div>
        `,
      });

      logger.info(`Critical storage alert sent to ${config.alertEmail}`);
    } catch (error) {
      logger.error('Failed to send critical storage email:', error as Error);
    }
  }

  logger.error(message);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Start storage monitoring
 */
export function startStorageMonitoring(): void {
  const config = DEFAULT_CONFIG;

  if (!config.enabled) {
    logger.info('Storage monitoring is disabled');
    return;
  }

  logger.info(`✅ Storage monitoring started (checking every ${config.checkIntervalMinutes} minutes)`);
  logger.info(`   Warning threshold: ${config.warningThresholdPercent}%`);
  logger.info(`   Critical threshold: ${config.criticalThresholdPercent}%`);
  logger.info(`   Quota: ${formatBytes(config.quotaBytes)}`);

  // Check immediately on start
  checkStorageUsage().catch(err => {
    logger.error('Initial storage check error:', err);
  });

  // Then check at configured interval
  setInterval(() => {
    checkStorageUsage().catch(err => {
      logger.error('Storage check error:', err);
    });
  }, config.checkIntervalMinutes * 60 * 1000);
}

export default {
  getStorageStats,
  checkStorageUsage,
  startStorageMonitoring,
};

