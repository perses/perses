import { Duration, sub } from 'date-fns';

export type TimeRange = AbsoluteTimeRange | RelativeTimeRange;

export interface AbsoluteTimeRange {
  start: Date;
  end: Date;
}

export interface RelativeTimeRange {
  // End date or undefined if relative to the current Date
  end?: Date;
  pastDuration: DurationString;
}

/**
 * Returns an absolute time range from a TimeRange that may be relative.
 */
export function toAbsoluteTimeRange(timeRange: TimeRange): AbsoluteTimeRange {
  if ('start' in timeRange) {
    return timeRange;
  }

  const end = timeRange.end ?? new Date();

  return {
    start: sub(end, parseDurationString(timeRange.pastDuration)),
    end,
  };
}

type MillisecondsDurationString = `${number}ms`;
type SecondsDurationString = `${number}s`;
type MinutesDurationString = `${number}m`;
type HoursDurationString = `${number}h`;
type DaysDurationString = `${number}d`;
type WeeksDurationString = `${number}w`;
type YearsDurationString = `${number}y`;

export type DurationString = Exclude<
  `${YearsDurationString | ''}${WeeksDurationString | ''}${
    | DaysDurationString
    | ''}${HoursDurationString | ''}${MinutesDurationString | ''}${
    | SecondsDurationString
    | ''}${MillisecondsDurationString | ''}`,
  ''
>;

const DURATION_REGEX =
  /^(?:(\d+)y)?(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?(?:(\d+)ms)?$/;

/**
 * Parses a DurationString into a Duration object with numeric values that can
 * be used to do Date math.
 */
export function parseDurationString(durationString: DurationString): Duration {
  if (durationString === '') {
    throw new Error('Empty string is not valid for duration strings');
  }

  const matches = DURATION_REGEX.exec(durationString);
  if (matches === null) {
    throw new Error(`Invalid duration string '${durationString}'`);
  }

  return {
    years: parseInt(matches[1] ?? '0'),
    months: 0,
    weeks: parseInt(matches[2] ?? '0'),
    days: parseInt(matches[3] ?? '0'),
    hours: parseInt(matches[4] ?? '0'),
    minutes: parseInt(matches[5] ?? '0'),
    seconds: parseInt(matches[6] ?? '0') + parseInt(matches[7] ?? '0') / 1000,
  };
}
