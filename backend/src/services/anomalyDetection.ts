/**
 * Anomaly Detection Service
 * Monitors error rates and alerts when unusual spikes are detected
 */

import { supabase } from '../config/supabase.js';
import { sendEmail } from './email.js';
import { logger } from './logger.js';

interface AnomalyConfig {
  enabled: boolean;
  errorThreshold: number; // Errors per minute
  warnThreshold: number; // Warnings per minute
  windowMinutes: number; // Time window to check
  cooldownMinutes: number; // Minimum time between alerts
  alertEmail?: string; // Admin email for alerts
  webhookUrl?: string; // Webhook for external alerting
}

// interface ErrorRate {
//   timestamp: Date;
//   errorCount: number;
//   warnCount: number;
  infoCount: number;
}

// Default configuration
const DEFAULT_CONFIG: AnomalyConfig = {
  enabled: process.env.ANOMALY_DETECTION_ENABLED === 'true',
  errorThreshold: parseInt(process.env.ANOMALY_ERROR_THRESHOLD || '10'), // 10 errors/min
  warnThreshold: parseInt(process.env.ANOMALY_WARN_THRESHOLD || '20'), // 20 warns/min
  windowMinutes: parseInt(process.env.ANOMALY_WINDOW_MINUTES || '5'), // Check last 5 minutes
  cooldownMinutes: parseInt(process.env.ANOMALY_COOLDOWN_MINUTES || '30'), // Alert every 30 min max
  alertEmail: process.env.ANOMALY_ALERT_EMAIL,
  webhookUrl: process.env.ANOMALY_WEBHOOK_URL,
};

// In-memory cache for last alert time
let lastAlertTime: Date | null = null;

/**
 * Get current anomaly detection configuration
 */
export async function getAnomalyConfig(): Promise<AnomalyConfig> {
  try {
    // Try to fetch from database (for admin-configurable settings)
    const { data, error } = await supabase
      .from('anomaly_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return DEFAULT_CONFIG;
    }

    return {
      enabled: data.enabled ?? DEFAULT_CONFIG.enabled,
      errorThreshold: data.error_threshold ?? DEFAULT_CONFIG.errorThreshold,
      warnThreshold: data.warn_threshold ?? DEFAULT_CONFIG.warnThreshold,
      windowMinutes: data.window_minutes ?? DEFAULT_CONFIG.windowMinutes,
      cooldownMinutes: data.cooldown_minutes ?? DEFAULT_CONFIG.cooldownMinutes,
      alertEmail: data.alert_email || DEFAULT_CONFIG.alertEmail,
      webhookUrl: data.webhook_url || DEFAULT_CONFIG.webhookUrl,
    };
  } catch (error) {
    logger.warn('Failed to fetch anomaly config from database, using defaults');
    return DEFAULT_CONFIG;
  }
}

/**
 * Update anomaly detection configuration
 */
export async function updateAnomalyConfig(config: Partial<AnomalyConfig>): Promise<void> {
  try {
    const { error } = await supabase
      .from('anomaly_config')
      .insert({
        enabled: config.enabled,
        error_threshold: config.errorThreshold,
        warn_threshold: config.warnThreshold,
        window_minutes: config.windowMinutes,
        cooldown_minutes: config.cooldownMinutes,
        alert_email: config.alertEmail,
        webhook_url: config.webhookUrl,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    logger.info('Anomaly detection config updated');
  } catch (error) {
    logger.error('Failed to update anomaly config:', error as Error);
    throw error;
  }
}

/**
 * Check for error rate anomalies
 */
export async function checkForAnomalies(): Promise<{
  anomalyDetected: boolean;
  details?: {
    errorRate: number;
    warnRate: number;
    threshold: number;
    window: number;
  };
}> {
  try {
    const config = await getAnomalyConfig();

    if (!config.enabled) {
      return { anomalyDetected: false };
    }

    // Check cooldown period
    if (lastAlertTime) {
      const minutesSinceLastAlert = (Date.now() - lastAlertTime.getTime()) / 1000 / 60;
      if (minutesSinceLastAlert < config.cooldownMinutes) {
        logger.debug(`Anomaly check skipped - in cooldown period (${Math.round(minutesSinceLastAlert)}/${config.cooldownMinutes} minutes)`);
        return { anomalyDetected: false };
      }
    }

    // Get error counts for the window period
    const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString();

    const { data: errorLogs, error } = await supabase
      .from('error_logs')
      .select('level, created_at')
      .gte('created_at', windowStart);

    if (error) {
      logger.error('Failed to fetch error logs for anomaly detection:', error);
      return { anomalyDetected: false };
    }

    if (!errorLogs || errorLogs.length === 0) {
      return { anomalyDetected: false };
    }

    // Count errors and warnings
    let errorCount = 0;
    let warnCount = 0;

    errorLogs.forEach(log => {
      if (log.level === 'error') errorCount++;
      if (log.level === 'warn') warnCount++;
    });

    // Calculate rates (per minute)
    const errorRate = errorCount / config.windowMinutes;
    const warnRate = warnCount / config.windowMinutes;

    logger.debug(`Error rate: ${errorRate.toFixed(2)}/min, Warn rate: ${warnRate.toFixed(2)}/min`);

    // Check if thresholds exceeded
    const errorThresholdExceeded = errorRate > config.errorThreshold;
    const warnThresholdExceeded = warnRate > config.warnThreshold;

    if (errorThresholdExceeded || warnThresholdExceeded) {
      logger.warn(`Anomaly detected! Error rate: ${errorRate.toFixed(2)}/min (threshold: ${config.errorThreshold}), Warn rate: ${warnRate.toFixed(2)}/min (threshold: ${config.warnThreshold})`);

      // Send alerts
      await sendAlerts(config, {
        errorRate,
        warnRate,
        errorCount,
        warnCount,
        windowMinutes: config.windowMinutes,
      });

      // Update last alert time
      lastAlertTime = new Date();

      return {
        anomalyDetected: true,
        details: {
          errorRate: parseFloat(errorRate.toFixed(2)),
          warnRate: parseFloat(warnRate.toFixed(2)),
          threshold: errorThresholdExceeded ? config.errorThreshold : config.warnThreshold,
          window: config.windowMinutes,
        },
      };
    }

    return { anomalyDetected: false };
  } catch (error) {
    logger.error('Error in anomaly detection:', error as Error);
    return { anomalyDetected: false };
  }
}

/**
 * Send alerts via email and/or webhook
 */
async function sendAlerts(config: AnomalyConfig, details: {
  errorRate: number;
  warnRate: number;
  errorCount: number;
  warnCount: number;
  windowMinutes: number;
}): Promise<void> {
  const message = `
🚨 Error Rate Anomaly Detected!

Time Window: Last ${details.windowMinutes} minutes
Error Count: ${details.errorCount} (${details.errorRate.toFixed(2)}/min)
Warning Count: ${details.warnCount} (${details.warnRate.toFixed(2)}/min)

Thresholds:
- Error threshold: ${config.errorThreshold}/min
- Warning threshold: ${config.warnThreshold}/min

Action Required:
1. Check the admin error dashboard
2. Investigate recent changes
3. Review error logs for patterns

Dashboard: ${process.env.FRONTEND_URL}/admin/errors
  `.trim();

  // Send email alert
  if (config.alertEmail) {
    try {
      await sendEmail({
        to: config.alertEmail,
        subject: '🚨 Petflix - Error Rate Anomaly Detected',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fee; border-left: 4px solid #f00; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #c00;">🚨 Error Rate Anomaly Detected</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h3>Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time Window:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">Last ${details.windowMinutes} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Error Count:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${details.errorCount} (${details.errorRate.toFixed(2)}/min)</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Warning Count:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${details.warnCount} (${details.warnRate.toFixed(2)}/min)</td>
                </tr>
              </table>
              
              <h3 style="margin-top: 20px;">Thresholds</h3>
              <ul>
                <li>Error threshold: <strong>${config.errorThreshold}/min</strong></li>
                <li>Warning threshold: <strong>${config.warnThreshold}/min</strong></li>
              </ul>

              <h3>Action Required</h3>
              <ol>
                <li>Check the admin error dashboard</li>
                <li>Investigate recent changes</li>
                <li>Review error logs for patterns</li>
              </ol>

              <div style="margin-top: 20px; text-align: center;">
                <a href="${process.env.FRONTEND_URL}/admin/errors" 
                   style="display: inline-block; padding: 12px 30px; background: #c00; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Error Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
      });

      logger.info(`Anomaly alert email sent to ${config.alertEmail}`);
    } catch (error) {
      logger.error('Failed to send anomaly alert email:', error as Error);
    }
  }

  // Send webhook alert
  if (config.webhookUrl) {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error_rate_anomaly',
          timestamp: new Date().toISOString(),
          details: {
            errorRate: details.errorRate,
            warnRate: details.warnRate,
            errorCount: details.errorCount,
            warnCount: details.warnCount,
            windowMinutes: details.windowMinutes,
            thresholds: {
              error: config.errorThreshold,
              warn: config.warnThreshold,
            },
          },
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      logger.info(`Anomaly alert webhook sent to ${config.webhookUrl}`);
    } catch (error) {
      logger.error('Failed to send anomaly alert webhook:', error as Error);
    }
  }

  // Always log to console
  logger.warn(message);
}

/**
 * Start anomaly detection monitoring
 * Checks for anomalies every minute
 */
export function startAnomalyDetection(): void {
  const config = DEFAULT_CONFIG;

  if (!config.enabled) {
    logger.info('Anomaly detection is disabled');
    return;
  }

  logger.info(`✅ Anomaly detection started (checking every minute)`);
  logger.info(`   Error threshold: ${config.errorThreshold}/min`);
  logger.info(`   Warning threshold: ${config.warnThreshold}/min`);
  logger.info(`   Window: ${config.windowMinutes} minutes`);
  logger.info(`   Cooldown: ${config.cooldownMinutes} minutes`);

  // Check immediately on start
  checkForAnomalies().catch(err => {
    logger.error('Initial anomaly check error:', err);
  });

  // Then check every minute
  setInterval(() => {
    checkForAnomalies().catch(err => {
      logger.error('Anomaly check error:', err);
    });
  }, 60 * 1000); // Every 1 minute
}

export default {
  getAnomalyConfig,
  updateAnomalyConfig,
  checkForAnomalies,
  startAnomalyDetection,
};

