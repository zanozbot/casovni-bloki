import { HOLYDAYS } from './holydays';
import { isEasterMonday } from './easter';

/**
 * High season start and end month.
 */
const HIGH_SEASON = {
	start: 10, // November
	end: 1 // February
};

/**
 * Low season start and end month.
 */
const LOW_SEASON = {
	start: 2, // March
	end: 9 // October
};

type TimeBlock = {
	id: number;
	periods: Array<{ start: number; end: number }>;
};

/**
 * Time blocks for high season on workdays.
 * Consolidated: each block ID appears once with all its time periods.
 */
const TIME_BLOCKS_HIGH_SEASON_WORKDAYS: TimeBlock[] = [
	{
		id: 1,
		periods: [
			{ start: 7, end: 14 },
			{ start: 16, end: 20 }
		]
	},
	{
		id: 2,
		periods: [
			{ start: 6, end: 7 },
			{ start: 14, end: 16 },
			{ start: 20, end: 22 }
		]
	},
	{ id: 3, periods: [{ start: 22, end: 30 }] } // 22:00 to 06:00 (30 = 6 next day in 24h+ format)
];

/**
 * Time blocks for high season on weekends and holidays.
 */
const TIME_BLOCKS_HIGH_SEASON_WEEKENDS_AND_HOLYDAYS: TimeBlock[] = [
	{
		id: 2,
		periods: [
			{ start: 7, end: 14 },
			{ start: 16, end: 20 }
		]
	},
	{
		id: 3,
		periods: [
			{ start: 6, end: 7 },
			{ start: 14, end: 16 },
			{ start: 20, end: 22 }
		]
	},
	{ id: 4, periods: [{ start: 22, end: 30 }] } // 22:00 to 06:00
];

/**
 * Time blocks for low season on workdays.
 */
const TIME_BLOCKS_LOW_SEASON_WORKDAYS: TimeBlock[] = [
	{
		id: 2,
		periods: [
			{ start: 7, end: 14 },
			{ start: 16, end: 20 }
		]
	},
	{
		id: 3,
		periods: [
			{ start: 6, end: 7 },
			{ start: 14, end: 16 },
			{ start: 20, end: 22 }
		]
	},
	{ id: 4, periods: [{ start: 22, end: 30 }] } // 22:00 to 06:00
];

/**
 * Time blocks for low season on weekends and holidays.
 */
const TIME_BLOCKS_LOW_SEASON_WEEKENDS_AND_HOLYDAYS: TimeBlock[] = [
	{
		id: 3,
		periods: [
			{ start: 7, end: 14 },
			{ start: 16, end: 20 }
		]
	},
	{
		id: 4,
		periods: [
			{ start: 6, end: 7 },
			{ start: 14, end: 16 },
			{ start: 20, end: 22 }
		]
	},
	{ id: 5, periods: [{ start: 22, end: 30 }] } // 22:00 to 06:00
];

/**
 * Get time blocks configuration for a given date.
 */
const getTimeBlocksConfig = (date: Date): TimeBlock[] => {
	const isWeekend = date.getDay() === 0 || date.getDay() === 6;
	const isHolyday = HOLYDAYS.some(
		(holyday) => holyday.day === date.getDate() && holyday.month === date.getMonth()
	);
	const _isEasterMonday = date.getMonth() === 2 && isEasterMonday(date);
	const isWeekendOrHolyday = isWeekend || isHolyday || _isEasterMonday;

	if (isHighSeason(date)) {
		return isWeekendOrHolyday
			? TIME_BLOCKS_HIGH_SEASON_WEEKENDS_AND_HOLYDAYS
			: TIME_BLOCKS_HIGH_SEASON_WORKDAYS;
	} else if (isLowSeason(date)) {
		return isWeekendOrHolyday
			? TIME_BLOCKS_LOW_SEASON_WEEKENDS_AND_HOLYDAYS
			: TIME_BLOCKS_LOW_SEASON_WORKDAYS;
	}
	return [];
};

/**
 * Check if an hour is within a time period (supports overnight spans).
 * Hours 0-23 are current day, 24-29 are hours 0-5 of next day.
 */
const isHourInPeriod = (hour: number, period: { start: number; end: number }): boolean => {
	if (period.end > 24) {
		// Overnight period (e.g., 22 to 30 means 22:00 to 06:00)
		return hour >= period.start || hour < period.end - 24;
	}
	return hour >= period.start && hour < period.end;
};

/**
 * Check if a given date is in high season.
 *
 * @param date Date
 * @returns boolean
 */
export const isHighSeason = (date: Date) => {
	const month = date.getMonth();
	return month >= HIGH_SEASON.start || month <= HIGH_SEASON.end;
};

/**
 * Check if a given date is in low season.
 *
 * @param date Date
 * @returns boolean
 */
export const isLowSeason = (date: Date) => {
	const month = date.getMonth();
	return month >= LOW_SEASON.start && month <= LOW_SEASON.end;
};

/**
 * Get the current time block for a given date.
 *
 * @param date Date
 * @returns TimeBlock with current period info
 */
export const getCurrentTimeBlock = (date: Date) => {
	const config = getTimeBlocksConfig(date);
	const currentHour = date.getHours();

	for (const block of config) {
		for (const period of block.periods) {
			if (isHourInPeriod(currentHour, period)) {
				// Return block info with the actual end time
				const endHour = period.end > 24 ? period.end - 24 : period.end;
				const isOvernight = period.end > 24;
				return {
					id: block.id,
					start: period.start,
					end: endHour,
					isOvernight
				};
			}
		}
	}

	return null;
};

/**
 * Get the block ID for a specific hour on a given date.
 *
 * @param date Date
 * @param hour Hour (0-23)
 * @returns Block ID (1-5)
 */
export const getBlockForHour = (date: Date, hour: number): number => {
	const config = getTimeBlocksConfig(date);

	for (const block of config) {
		for (const period of block.periods) {
			if (isHourInPeriod(hour, period)) {
				return block.id;
			}
		}
	}

	return 5; // Default fallback
};

/**
 * Generate time blocks for a given date (legacy compatibility).
 * Returns array of individual time periods for visualization.
 *
 * @param date Date
 * @returns array of time blocks with start/end for each period
 */
export const generateTimeBlocks = (date: Date) => {
	const config = getTimeBlocksConfig(date);
	const blocks: Array<{ id: number; start: number; end: number; day?: number }> = [];

	for (const block of config) {
		for (const period of block.periods) {
			if (period.end > 24) {
				// Split overnight period into two entries for compatibility
				blocks.push({ id: block.id, start: period.start, end: 0, day: 1 });
				blocks.push({ id: block.id, start: 0, end: period.end - 24 });
			} else {
				blocks.push({ id: block.id, start: period.start, end: period.end });
			}
		}
	}

	return blocks;
};
