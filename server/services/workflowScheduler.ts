import { db, Workflow, WorkflowNodeData } from '../db';
import { WorkflowEngine } from '../engine/workflowEngine';

// Helper to evaluate standard 5-part cron syntax against a given Date:
// [minute, hour, dayOfMonth, month, dayOfWeek]
export function matchesCron(cron: string, date: Date, timezone: string = 'Asia/Kolkata'): boolean {
  if (!cron || typeof cron !== 'string') return false;
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return false;

  // Convert date into the target timezone
  let targetDate = date;
  try {
    const tzString = date.toLocaleString('en-US', { timeZone: timezone });
    targetDate = new Date(tzString);
  } catch (e) {
    targetDate = date;
  }

  const minute = targetDate.getMinutes();
  const hour = targetDate.getHours();
  const dayOfMonth = targetDate.getDate();
  const month = targetDate.getMonth() + 1; // 1-12
  const dayOfWeek = targetDate.getDay(); // 0-6 (0 is Sunday)

  const matchField = (field: string, val: number, isDow: boolean = false): boolean => {
    if (field === '*' || field === '?') return true;
    
    // Step: */5 or 0-30/5
    if (field.includes('/')) {
      const [range, stepStr] = field.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return false;
      if (range === '*' || range === '') {
        return val % step === 0;
      }
      const [startStr, endStr] = range.split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : 59;
      if (val >= start && val <= end) {
        return (val - start) % step === 0;
      }
      return false;
    }

    // List: 1,3,5
    if (field.includes(',')) {
      return field.split(',').some((sub) => matchField(sub.trim(), val, isDow));
    }

    // Range: 1-5
    if (field.includes('-')) {
      const [startStr, endStr] = field.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      return val >= start && val <= end;
    }

    // Exact number
    const exact = parseInt(field, 10);
    if (isDow && field === '7') {
      return val === 0; // 7 can represent Sunday
    }
    return val === exact;
  };

  const [mField, hField, domField, monField, dowField] = parts;

  return (
    matchField(mField, minute) &&
    matchField(hField, hour) &&
    matchField(domField, dayOfMonth) &&
    matchField(monField, month) &&
    matchField(dowField, dayOfWeek, true)
  );
}

// Calculate the next execution time for a cron expression
export function getNextCronRun(cron: string, timezone: string = 'Asia/Kolkata', fromDate: Date = new Date()): Date {
  const check = new Date(fromDate.getTime() + 60000);
  check.setSeconds(0, 0);

  // Search forward up to 7 days minute-by-minute (or jump hourly)
  for (let i = 0; i < 60 * 24 * 7; i++) {
    const candidate = new Date(check.getTime() + i * 60000);
    if (matchesCron(cron, candidate, timezone)) {
      return candidate;
    }
  }
  return new Date(fromDate.getTime() + 3600000);
}

export class WorkflowScheduler {
  private static timer: NodeJS.Timeout | null = null;
  private static lastExecutedKeys = new Set<string>();

  public static start() {
    if (this.timer) return;
    console.log('[WorkflowScheduler] Background schedule worker activated.');

    // Run check every 15 seconds to ensure exact minute triggering
    this.timer = setInterval(() => {
      this.checkAndTriggerSchedules().catch((err) => {
        console.error('[WorkflowScheduler] Error checking schedules:', err);
      });
    }, 15000);

    // Initial check right after startup
    setTimeout(() => {
      this.checkAndTriggerSchedules().catch(() => {});
    }, 2000);
  }

  public static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[WorkflowScheduler] Scheduler stopped.');
    }
  }

  public static async checkAndTriggerSchedules() {
    const now = new Date();
    const workflows: Workflow[] = db.get('workflows') || [];

    // Clean up old execution keys older than 1 hour (keep memory clean)
    if (this.lastExecutedKeys.size > 500) {
      this.lastExecutedKeys.clear();
    }

    for (const wf of workflows) {
      // Find all schedule trigger nodes in the workflow
      const scheduleNodes = (wf.nodes || []).filter(
        (n: WorkflowNodeData) => n.type === 'trigger_schedule' && !n.disabled
      );

      if (scheduleNodes.length === 0) continue;

      for (const node of scheduleNodes) {
        const config = node.config || {};
        let cron = config.cron || '0 9 * * *';

        // Check if user set exact time e.g. exactTime: "14:30" or dailyTime: "09:00"
        if (config.exactTime && typeof config.exactTime === 'string' && config.exactTime.includes(':')) {
          const [h, m] = config.exactTime.split(':');
          cron = `${parseInt(m, 10)} ${parseInt(h, 10)} * * *`;
        } else if (config.triggerInterval === 'minute' || config.triggerInterval === 'every_minute') {
          cron = '* * * * *';
        } else if (config.triggerInterval === 'minutes_5') {
          cron = '*/5 * * * *';
        } else if (config.triggerInterval === 'minutes_15') {
          cron = '*/15 * * * *';
        } else if (config.triggerInterval === 'hours' || config.triggerInterval === 'hourly') {
          cron = '0 * * * *';
        }

        const timezone = config.timezone || 'Asia/Kolkata';

        // Evaluate if right now matches
        if (matchesCron(cron, now, timezone)) {
          // Construct unique minute key to avoid firing multiple times in the same minute
          const minuteKey = `${wf.id}_${node.id}_${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;

          if (this.lastExecutedKeys.has(minuteKey)) {
            continue; // Already triggered this minute
          }

          this.lastExecutedKeys.add(minuteKey);
          console.log(`[WorkflowScheduler] ⏰ Scheduled trigger fired for workflow "${wf.name}" (${wf.id}) at ${now.toLocaleTimeString()} (Cron: ${cron}, TZ: ${timezone})`);

          try {
            await WorkflowEngine.executeWorkflow(wf, 'schedule', {
              scheduledTime: now.toISOString(),
              cron,
              timezone,
              triggerNodeId: node.id,
              triggerNodeName: node.name,
              reason: 'Scheduled trigger fired at set time',
            });
          } catch (execErr: any) {
            console.error(`[WorkflowScheduler] Failed executing workflow "${wf.name}":`, execErr?.message);
          }
        }
      }
    }
  }

  public static getStatus() {
    const now = new Date();
    const workflows: Workflow[] = db.get('workflows') || [];
    const scheduledList: Array<{
      workflowId: string;
      workflowName: string;
      active: boolean;
      nodeId: string;
      nodeName: string;
      cron: string;
      timezone: string;
      nextRun: string;
      nextRunMs: number;
    }> = [];

    for (const wf of workflows) {
      const scheduleNodes = (wf.nodes || []).filter(
        (n: WorkflowNodeData) => n.type === 'trigger_schedule' && !n.disabled
      );

      for (const node of scheduleNodes) {
        const config = node.config || {};
        let cron = config.cron || '0 9 * * *';
        if (config.exactTime && typeof config.exactTime === 'string' && config.exactTime.includes(':')) {
          const [h, m] = config.exactTime.split(':');
          cron = `${parseInt(m, 10)} ${parseInt(h, 10)} * * *`;
        }
        const tz = config.timezone || 'Asia/Kolkata';
        const next = getNextCronRun(cron, tz, now);

        scheduledList.push({
          workflowId: wf.id,
          workflowName: wf.name,
          active: Boolean(wf.active),
          nodeId: node.id,
          nodeName: node.name,
          cron,
          timezone: tz,
          nextRun: next.toISOString(),
          nextRunMs: Math.max(0, next.getTime() - now.getTime()),
        });
      }
    }

    return {
      running: Boolean(this.timer),
      serverTimeUtc: now.toISOString(),
      serverTimeIst: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      totalScheduledWorkflows: scheduledList.length,
      scheduledList,
    };
  }
}
