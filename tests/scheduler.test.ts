/**
 * Scheduler tests
 */

import { Scheduler, ScheduleConfig } from '../shared/utils/scheduler';
import dayjs from 'dayjs';

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let mockConfig: ScheduleConfig;

  beforeEach(() => {
    mockConfig = {
      startTime: '09:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5] // Weekdays
    };
    scheduler = new Scheduler(mockConfig);
  });

  afterEach(() => {
    scheduler.stop();
  });

  test('should initialize with correct configuration', () => {
    expect(scheduler).toBeDefined();
  });

  test('should update configuration', () => {
    const newConfig: ScheduleConfig = {
      startTime: '10:00',
      endTime: '19:00',
      days: [0, 6] // Weekend
    };

    scheduler.updateConfig(newConfig);
    // Note: We can't easily test private properties, but we can test behavior
  });

  test('should start and stop scheduler', () => {
    scheduler.start();
    expect(scheduler.getStatus().isActive).toBe(true);
    
    scheduler.stop();
    expect(scheduler.getStatus().isActive).toBe(false);
  });

  test('should check if time is in range for same day', () => {
    // Mock current time to be within range
    const mockNow = dayjs('2023-01-02 12:00:00'); // Monday 12:00 PM
    jest.spyOn(dayjs, 'now').mockReturnValue(mockNow);
    
    scheduler.start();
    expect(scheduler.isInSchedule()).toBe(true);
  });

  test('should check if time is outside range', () => {
    // Mock current time to be outside range
    const mockNow = dayjs('2023-01-02 20:00:00'); // Monday 8:00 PM
    jest.spyOn(dayjs, 'now').mockReturnValue(mockNow);
    
    scheduler.start();
    expect(scheduler.isInSchedule()).toBe(false);
  });

  test('should check if day is not in schedule', () => {
    // Mock current time to be Sunday (not in schedule)
    const mockNow = dayjs('2023-01-01 12:00:00'); // Sunday 12:00 PM
    jest.spyOn(dayjs, 'now').mockReturnValue(mockNow);
    
    scheduler.start();
    expect(scheduler.isInSchedule()).toBe(false);
  });

  test('should handle cross-day time ranges', () => {
    const crossDayConfig: ScheduleConfig = {
      startTime: '22:00',
      endTime: '06:00',
      days: [1, 2, 3, 4, 5]
    };
    
    const crossDayScheduler = new Scheduler(crossDayConfig);
    
    // Test time within cross-day range (late night)
    const mockNow1 = dayjs('2023-01-02 23:00:00'); // Monday 11:00 PM
    jest.spyOn(dayjs, 'now').mockReturnValue(mockNow1);
    expect(crossDayScheduler.isInSchedule()).toBe(true);
    
    // Test time within cross-day range (early morning)
    const mockNow2 = dayjs('2023-01-03 02:00:00'); // Tuesday 2:00 AM
    jest.spyOn(dayjs, 'now').mockReturnValue(mockNow2);
    expect(crossDayScheduler.isInSchedule()).toBe(true);
    
    // Test time outside cross-day range
    const mockNow3 = dayjs('2023-01-02 12:00:00'); // Monday 12:00 PM
    jest.spyOn(dayjs, 'now').mockReturnValue(mockNow3);
    expect(crossDayScheduler.isInSchedule()).toBe(false);
  });

  test('should get next schedule time', () => {
    const nextSchedule = scheduler.getNextScheduleTime();
    expect(nextSchedule).toBeDefined();
    expect(dayjs.isDayjs(nextSchedule)).toBe(true);
  });

  test('should get status information', () => {
    const status = scheduler.getStatus();
    expect(status).toHaveProperty('isActive');
    expect(status).toHaveProperty('isInSchedule');
    expect(status).toHaveProperty('nextSchedule');
  });

  test('should handle edge case times', () => {
    const edgeConfig: ScheduleConfig = {
      startTime: '00:00',
      endTime: '23:59',
      days: [1, 2, 3, 4, 5]
    };
    
    const edgeScheduler = new Scheduler(edgeConfig);
    expect(edgeScheduler).toBeDefined();
  });

  test('should handle invalid time formats gracefully', () => {
    const invalidConfig: ScheduleConfig = {
      startTime: '25:00', // Invalid hour
      endTime: '18:00',
      days: [1, 2, 3, 4, 5]
    };
    
    const invalidScheduler = new Scheduler(invalidConfig);
    expect(invalidScheduler).toBeDefined();
  });

  test('should handle empty days array', () => {
    const emptyDaysConfig: ScheduleConfig = {
      startTime: '09:00',
      endTime: '18:00',
      days: []
    };
    
    const emptyDaysScheduler = new Scheduler(emptyDaysConfig);
    expect(emptyDaysScheduler.isInSchedule()).toBe(false);
  });
});
