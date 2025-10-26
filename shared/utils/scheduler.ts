/**
 * 时间调度器
 * 用于管理抓取任务的时间调度
 */

import dayjs from 'dayjs';

export interface ScheduleConfig {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  days: number[];    // 0-6 (Sunday-Saturday)
}

export class Scheduler {
  private config: ScheduleConfig;
  private isActive: boolean = false;
  private intervalId: number | null = null;

  constructor(config: ScheduleConfig) {
    this.validateConfig(config);
    this.config = config;
  }
  
  /**
   * 验证配置的合法性
   */
  private validateConfig(config: ScheduleConfig): void {
    if (!config.startTime || !config.endTime) {
      throw new Error('Start time and end time are required');
    }
    
    if (!Array.isArray(config.days) || config.days.length === 0) {
      throw new Error('At least one day must be selected');
    }
    
    // 验证时间格式
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(config.startTime) || !timePattern.test(config.endTime)) {
      throw new Error('Invalid time format. Expected HH:MM');
    }
    
    // 验证日期范围
    const invalidDays = config.days.filter(day => day < 0 || day > 6);
    if (invalidDays.length > 0) {
      throw new Error(`Invalid day values: ${invalidDays.join(', ')}`);
    }
  }

  /**
   * 更新调度配置
   */
  updateConfig(config: ScheduleConfig): void {
    this.validateConfig(config);
    this.config = config;
    if (this.isActive) {
      this.stop();
      this.start();
    }
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    // Use global setTimeout for compatibility with service worker context
    const setIntervalFn = typeof window !== 'undefined' ? window.setInterval : setInterval;
    const setTimeoutFn = typeof window !== 'undefined' ? window.setTimeout : setTimeout;
    
    this.intervalId = setIntervalFn(() => {
      this.checkSchedule();
    }, 60000) as any; // 每分钟检查一次

    // 立即检查一次
    setTimeoutFn(() => {
      this.checkSchedule();
    }, 0);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.intervalId !== null) {
      const clearIntervalFn = typeof window !== 'undefined' ? window.clearInterval : clearInterval;
      clearIntervalFn(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
  }

  /**
   * 检查是否在调度时间内
   */
  isInSchedule(): boolean {
    const now = dayjs();
    const currentDay = now.day();
    const currentTime = now.format('HH:mm');

    // 检查是否在允许的日期
    if (!this.config.days.includes(currentDay)) {
      return false;
    }

    // 检查是否在时间范围内
    return this.isTimeInRange(currentTime, this.config.startTime, this.config.endTime);
  }

  /**
   * 检查时间是否在范围内
   */
  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      // 同一天内的时间范围
      return current >= start && current <= end;
    } else {
      // 跨天的时间范围
      return current >= start || current <= end;
    }
  }

  /**
   * 将时间字符串转换为分钟数
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * 检查调度并触发回调
   */
  private checkSchedule(): void {
    if (this.isInSchedule()) {
      this.onScheduleTrigger();
    }
  }

  /**
   * 调度触发回调 - 子类可重写
   */
  protected onScheduleTrigger(): void {
    // 默认实现为空，子类可重写
  }

  /**
   * 获取下次调度时间
   */
  getNextScheduleTime(): dayjs.Dayjs | null {
    const now = dayjs();
    const currentTime = now.format('HH:mm');
    const currentDay = now.day();
    
    // Parse start time components
    const [startHour, startMinute] = this.config.startTime.split(':').map(Number);

    // 查找下一个允许的日期
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (this.config.days.includes(checkDay)) {
        const targetDate = now.add(i, 'day');
        
        if (i === 0) {
          // 今天，检查是否还有时间
          if (this.isTimeInRange(currentTime, this.config.startTime, this.config.endTime)) {
            return now;
          }
        }
        
        // 返回指定日期的开始时间
        return targetDate.hour(startHour).minute(startMinute).second(0);
      }
    }

    return null;
  }

  /**
   * 获取当前状态
   */
  getStatus(): { isActive: boolean; isInSchedule: boolean; nextSchedule?: string } {
    return {
      isActive: this.isActive,
      isInSchedule: this.isInSchedule(),
      nextSchedule: this.getNextScheduleTime()?.format('YYYY-MM-DD HH:mm:ss')
    };
  }
}
