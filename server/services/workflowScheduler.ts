import { db, Workflow, WorkflowNodeData } from '../db';
import { WorkflowEngine } from '../engine/workflowEngine';

// Normalize any cron (5-part, 6-part with seconds, or 7-part quartz) into standard 5-part cron
export function normalizeCron(cron: string): string {
  if (!cron || typeof cron !== 'string') return '0 9,21 * * *';
  const parts = cron.trim().split(/\s+/);
  if (parts.length === 6) {
    // 6-part cron: [second, minute, hour, dayOfMonth, month, dayOfWeek]
    // Strip the leading seconds field:
    return parts.slice(1).join(' ');
  }
  if (parts.length >= 7) {
    // 7-part quartz: [second, minute, hour, dayOfMonth, month, dayOfWeek, year]
    return parts.slice(1, 6).join(' ');
  }
  if (parts.length === 5) {
    return parts.join(' ');
  }
  return cron.trim();
}

// Parse any user-entered time expression (24h, 12h AM/PM, comma-separated, single numbers) into canonical cron
export function parseExactTimeToCron(exactTimeStr: string, timezone: string = 'Asia/Kolkata'): { cron: string; timezone: string; description: string } | null {
  if (!exactTimeStr || typeof exactTimeStr !== 'string') return null;
  const raw = exactTimeStr.trim();
  if (!raw) return null;

  const tokens = raw.split(',').map((t) => t.trim()).filter(Boolean);
  const parsedItems: Array<{ hour: number; minute: number }> = [];

  for (const token of tokens) {
    const isPM = /PM/i.test(token);
    const isAM = /AM/i.test(token);
    const cleanToken = token.replace(/AM|PM/gi, '').trim();

    if (cleanToken.includes(':')) {
      const [hStr, mStr] = cleanToken.split(':');
      let h = parseInt(hStr.trim(), 10);
      let m = parseInt(mStr.trim(), 10);
      if (isNaN(h)) continue;
      if (isNaN(m)) m = 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        parsedItems.push({ hour: h, minute: m });
      }
    } else {
      let h = parseInt(cleanToken, 10);
      if (!isNaN(h)) {
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        if (h >= 0 && h <= 23) {
          parsedItems.push({ hour: h, minute: 0 });
        }
      }
    }
  }

  if (parsedItems.length > 0) {
    const min = parsedItems[0].minute;
    const hours = parsedItems.map((p) => p.hour);
    const uniqueHours = Array.from(new Set(hours)).sort((a, b) => a - b);
    return {
      cron: `${min} ${uniqueHours.join(',')} * * *`,
      timezone,
      description: `Daily at ${raw} (${timezone})`,
    };
  }
  return null;
}

// Convert node configuration into canonical 5-part cron syntax
export function resolveScheduleFromNode(node: WorkflowNodeData): { cron: string; timezone: string; description: string } {
  const config = node.config || {};
  const timezone = config.timezone || 'Asia/Kolkata';

  // 1. If explicit Custom Cron expression is selected
  if (config.triggerInterval === 'cron' && config.cron && typeof config.cron === 'string') {
    const normalized = normalizeCron(config.cron);
    return { cron: normalized, timezone, description: `Custom cron schedule (${normalized})` };
  }

  // 2. High-priority minute/hour intervals
  const intervalMode = config.triggerInterval;
  if (intervalMode === 'minute' || intervalMode === 'every_minute' || intervalMode === 'minutes_1') {
    return { cron: '* * * * *', timezone, description: 'Every 1 minute (Instant Live Trigger)' };
  }
  if (intervalMode === 'minutes_2') {
    return { cron: '*/2 * * * *', timezone, description: 'Every 2 minutes' };
  }
  if (intervalMode === 'minutes_5') {
    return { cron: '*/5 * * * *', timezone, description: 'Every 5 minutes' };
  }
  if (intervalMode === 'minutes_10') {
    return { cron: '*/10 * * * *', timezone, description: 'Every 10 minutes' };
  }
  if (intervalMode === 'minutes_15') {
    return { cron: '*/15 * * * *', timezone, description: 'Every 15 minutes' };
  }
  if (intervalMode === 'minutes_30') {
    return { cron: '*/30 * * * *', timezone, description: 'Every 30 minutes' };
  }
  if (intervalMode === 'hours' || intervalMode === 'hourly') {
    return { cron: '0 * * * *', timezone, description: 'Every hour at minute 0' };
  }

  // 3. Exact user time string (e.g. "09:00, 21:00" or "09:00" or "16:45" or "4:30 PM")
  const exactTimeStr = (config.exactTime || config.time || config.dailyTime || '').toString().trim();
  if (exactTimeStr) {
    const parsed = parseExactTimeToCron(exactTimeStr, timezone);
    if (parsed) return parsed;
  }

  // 4. Fallback interval presets
  const generalInterval = config.triggerInterval || config.interval;
  if (generalInterval === 'twice_daily') {
    return { cron: '0 9,21 * * *', timezone, description: 'Every day at 9:00 AM & 9:00 PM (IST)' };
  }
  if (generalInterval === 'daily_time' || generalInterval === 'days') {
    return { cron: '0 9 * * *', timezone, description: 'Every day at 9:00 AM' };
  }
  if (generalInterval === 'weeks') {
    return { cron: '0 9 * * 1', timezone, description: 'Every Monday at 9:00 AM' };
  }
  if (generalInterval === 'months') {
    return { cron: '0 9 1 * *', timezone, description: '1st of Every Month at 9:00 AM' };
  }

  // 5. Raw cron or cronExpression provided
  const rawCron = config.cron || config.cronExpression;
  if (rawCron && typeof rawCron === 'string') {
    const normalized = normalizeCron(rawCron);
    let desc = `Custom schedule (${normalized})`;
    if (normalized === '0 9,21 * * *') desc = 'Every day at 9:00 AM & 9:00 PM';
    else if (normalized === '0 9 * * *') desc = 'Every day at 09:00 AM';
    else if (normalized === '* * * * *') desc = 'Every 1 minute (Continuously)';
    else if (normalized === '*/2 * * * *') desc = 'Every 2 minutes';
    else if (normalized === '*/5 * * * *') desc = 'Every 5 minutes';
    else if (normalized === '0 * * * *') desc = 'Every hour at minute 0';
    return { cron: normalized, timezone, description: desc };
  }

  // 6. Default fallback
  return { cron: '0 9,21 * * *', timezone, description: 'Every day at 9:00 AM & 9:00 PM' };
}

// Extract exact calendar fields in target timezone using Intl standard formatters
export function getTimePartsInZone(date: Date, timezone: string = 'Asia/Kolkata') {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => {
      const item = parts.find((p) => p.type === type);
      return item ? parseInt(item.value, 10) : 0;
    };

    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' });
    const dayStr = dayFormatter.format(date);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dayMap[dayStr] ?? date.getDay();

    let hour = getVal('hour');
    if (hour === 24) hour = 0; // standard 24h normalization

    return {
      year: getVal('year'),
      month: getVal('month'), // 1-12
      dayOfMonth: getVal('day'),
      hour,
      minute: getVal('minute'),
      second: getVal('second'),
      dayOfWeek: dow, // 0-6
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      dayOfMonth: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dayOfWeek: date.getDay(),
    };
  }
}

// Helper to evaluate 5-part cron syntax against a given Date:
// [minute, hour, dayOfMonth, month, dayOfWeek]
export function matchesCron(rawCron: string, date: Date, timezone: string = 'Asia/Kolkata'): boolean {
  if (!rawCron || typeof rawCron !== 'string') return false;
  const cron = normalizeCron(rawCron);
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return false;

  const { minute, hour, dayOfMonth, month, dayOfWeek } = getTimePartsInZone(date, timezone);

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

    // List: 1,3,5 or 9,21 or 09,21
    if (field.includes(',')) {
      return field.split(',').some((sub) => matchField(sub.trim(), val, isDow));
    }

    // Range: 1-5 or 9-17
    if (field.includes('-')) {
      const [startStr, endStr] = field.split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : 59;
      return val >= start && val <= end;
    }

    // Exact number (support leading zeroes like "09")
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
export function getNextCronRun(rawCron: string, timezone: string = 'Asia/Kolkata', fromDate: Date = new Date()): Date {
  const cron = normalizeCron(rawCron);
  const check = new Date(fromDate.getTime() + 60000);
  check.setSeconds(0, 0);

  // Search forward up to 7 days minute-by-minute
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
    console.log('[WorkflowScheduler] 🚀 Background schedule worker activated (Checks every 5s).');

    // Run check every 5 seconds to guarantee immediate minute triggering
    this.timer = setInterval(() => {
      this.checkAndTriggerSchedules().catch((err) => {
        console.error('[WorkflowScheduler] Error checking schedules:', err);
      });
    }, 5000);

    // Initial check right after startup
    setTimeout(() => {
      this.checkAndTriggerSchedules().catch(() => {});
    }, 1000);
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

    // Clean up old execution keys older than 1 hour
    if (this.lastExecutedKeys.size > 500) {
      this.lastExecutedKeys.clear();
    }

    for (const wf of workflows) {
      // If workflow explicitly disabled, skip
      if (wf.active === false) continue;

      // Find all schedule trigger nodes in the workflow (supporting standard & custom aliases)
      const scheduleNodes = (wf.nodes || []).filter(
        (n: any) =>
          (n.type === 'trigger_schedule' ||
           n.type === 'scheduleTrigger' ||
           n.type === 'eie-nodes-base.scheduleTrigger' ||
           n.type === 'schedule' ||
           n.type === 'core_schedule' ||
           n.packageIdentifier === 'eie-nodes-base.scheduleTrigger') &&
          !n.disabled
      );

      if (scheduleNodes.length === 0) continue;

      for (const node of scheduleNodes) {
        const { cron, timezone, description } = resolveScheduleFromNode(node);

        // Evaluate if current time matches schedule in the target timezone
        if (matchesCron(cron, now, timezone)) {
          // Construct unique minute key using target timezone values to avoid duplicate firings in same minute
          const parts = getTimePartsInZone(now, timezone);
          const minuteKey = `${wf.id}_${node.id}_${parts.year}-${parts.month}-${parts.dayOfMonth}-${parts.hour}-${parts.minute}`;

          if (this.lastExecutedKeys.has(minuteKey)) {
            continue; // Already triggered this minute
          }

          this.lastExecutedKeys.add(minuteKey);
          console.log(`[WorkflowScheduler] ⏰ Automatic trigger fired! Workflow "${wf.name}" (${wf.id}) at ${now.toLocaleTimeString()} (Cron: ${cron}, TZ: ${timezone}, Schedule: ${description})`);

          try {
            await WorkflowEngine.executeWorkflow(wf, 'schedule', {
              scheduledTime: now.toISOString(),
              cron,
              timezone,
              triggerNodeId: node.id,
              triggerNodeName: node.name,
              scheduleDescription: description,
              reason: 'Scheduled trigger fired at set time automatically',
            });
          } catch (execErr: any) {
            console.error(`[WorkflowScheduler] Failed executing scheduled workflow "${wf.name}":`, execErr?.message);
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
      description: string;
      timezone: string;
      nextRun: string;
      nextRunMs: number;
      readableTimeIst: string;
    }> = [];

    for (const wf of workflows) {
      const scheduleNodes = (wf.nodes || []).filter(
        (n: any) =>
          (n.type === 'trigger_schedule' ||
           n.type === 'scheduleTrigger' ||
           n.type === 'eie-nodes-base.scheduleTrigger' ||
           n.type === 'schedule' ||
           n.type === 'core_schedule' ||
           n.packageIdentifier === 'eie-nodes-base.scheduleTrigger') &&
          !n.disabled
      );

      for (const node of scheduleNodes) {
        const { cron, timezone, description } = resolveScheduleFromNode(node);
        const next = getNextCronRun(cron, timezone, now);

        scheduledList.push({
          workflowId: wf.id,
          workflowName: wf.name,
          active: wf.active !== false,
          nodeId: node.id,
          nodeName: node.name,
          cron,
          description,
          timezone,
          nextRun: next.toISOString(),
          nextRunMs: Math.max(0, next.getTime() - now.getTime()),
          readableTimeIst: next.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
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

