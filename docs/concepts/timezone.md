# Timezone Resolution

Perses supports multiple levels of timezone configuration to provide flexibility in how timestamps are displayed across dashboards and panels.

## Overview

Timezone configuration in Perses determines how date and time values are formatted and displayed throughout the application. The system uses a resolution hierarchy to determine which timezone to apply when formatting timestamps.

> **Note**: This documentation describes the current timezone behavior and the planned multi-level configuration system. As Perses evolves to support multiple configuration levels, this document will be updated to reflect the implementation details.

## Current Implementation

As of the current version, Perses implements timezone handling primarily through the date formatting system in the UI layer.

### Date Format Units

Perses provides several date format units, each with specific timezone behavior:

#### Fixed Timezone Formats

These formats always use a specific timezone regardless of user settings:

- **`datetime-iso`**: Always displays in GMT/UTC (ISO 8601 format)
- **`datetime-us`**: Always displays in US Eastern timezone (America/New_York)
- **`date-iso`**: Always displays date in GMT/UTC
- **`date-us`**: Always displays date in US Eastern timezone
- **`time-iso`**: Always displays time in GMT/UTC
- **`time-us`**: Always displays time in US Eastern timezone

#### Browser-Local Formats

These formats use the browser's detected local timezone:

- **`datetime-local`**: Displays date and time in browser's local timezone (24-hour format)
- **`date-local`**: Displays date in browser's local timezone
- **`time-local`**: Displays time in browser's local timezone (24-hour format)

#### Other Formats

- **`relative-time`**: Displays relative time (e.g., "5 minutes ago", "2 hours ago")
- **`unix-timestamp`**: Displays raw Unix timestamp in seconds
- **`unix-timestamp-ms`**: Displays raw Unix timestamp in milliseconds

## Timezone Resolution Logic

### Current Behavior

The timezone resolution follows this logic when formatting dates:

1. **Format-Specific Override**: If the date format unit has a hardcoded timezone (e.g., `datetime-us`, `time-iso`), that timezone is always used
2. **Explicit timeZone Parameter**: If a `timeZone` parameter is provided in the format options, it is used for formats that support it
3. **Browser Default**: For local formats or when no timezone is specified, the browser's detected timezone is used

### Code Implementation

The timezone resolution is implemented in `ui/core/src/model/units/date.ts`:

```typescript
export function formatDate(value: number, options: DateFormatOptions = {}): string {
  const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    unit = 'datetime-local',
    locale = getBrowserLocale(),
    timeZone = systemTimeZone,  // Default to browser's timezone
    referenceTime = Date.now(),
  } = options;

  // Format-specific timezone handling...
}
```

### Format Options

When calling the date formatter, you can provide these options:

- **`unit`**: The date format unit to use (default: `'datetime-local'`)
- **`locale`**: The locale for formatting (default: browser's locale)
- **`timeZone`**: The timezone to use for formatting (default: browser's timezone)
- **`referenceTime`**: Reference time for relative formatting (default: current time)

## Future Enhancements

According to the CHANGELOG, Perses introduced a `TimeZoneProvider` feature (mentioned in version history) to allow specifying a timezone other than browser/local. This feature is planned to support multiple configuration levels.

### Planned Timezone Configuration Levels

The following levels are expected to be supported (in order of precedence, highest to lowest):

1. **Panel-Level Configuration**: Timezone specified directly on a panel
   - Allows individual panels to override the dashboard timezone
   - Useful for panels displaying data from specific regions
   
2. **Dashboard-Level Configuration**: Timezone specified for an entire dashboard
   - Sets a consistent timezone for all panels in a dashboard
   - Overrides user and project defaults
   
3. **User Preference**: User's personal timezone preference
   - Allows users to set their preferred timezone in their profile
   - Applied across all dashboards unless overridden
   
4. **Project-Level Configuration**: Default timezone for a project
   - Sets a default timezone for all dashboards in a project
   - Useful for region-specific projects
   
5. **Global Configuration**: System-wide default timezone
   - Configured in the Perses server configuration
   - Applies when no other timezone is specified
   
6. **Browser Default**: Fallback to browser's detected timezone
   - Used when no explicit configuration is provided at any level
   - Automatically detected from the user's system

### Resolution Algorithm

When multiple timezone configurations are present, Perses will resolve the timezone using this algorithm:

```
IF panel has timezone configured THEN
    USE panel timezone
ELSE IF dashboard has timezone configured THEN
    USE dashboard timezone
ELSE IF user has timezone preference THEN
    USE user timezone
ELSE IF project has default timezone THEN
    USE project timezone
ELSE IF global timezone is configured THEN
    USE global timezone
ELSE
    USE browser detected timezone
END IF
```

> **Important**: The exact implementation details and configuration options for these levels are still being developed. This documentation will be updated as the feature evolves. Contributors should refer to this document when implementing timezone configuration at any level.

## Usage Examples

### Using Fixed Timezones

```typescript
// Always display in US Eastern time
formatDate(timestamp, { unit: 'datetime-us' });
// Output: "01/01/2024, 7:30:45 AM" (in US Eastern)

// Always display in GMT/UTC
formatDate(timestamp, { unit: 'datetime-iso' });
// Output: "2024-01-01T12:30:45.000Z"
```

### Using Browser Local Time

```typescript
// Display in user's browser timezone
formatDate(timestamp, { unit: 'datetime-local' });
// Output varies based on browser timezone
// In PST: "01/01/2024, 04:30:45"
// In JST: "01/01/2024, 21:30:45"
```

### Specifying Custom Timezone

```typescript
// Override timezone for local formats
formatDate(timestamp, { 
  unit: 'datetime-local', 
  timeZone: 'Europe/London' 
});
// Output: "01/01/2024, 12:30:45" (in London time)
```

## Best Practices

1. **Use ISO formats for UTC times**: When displaying absolute timestamps that should be consistent across all users, use `datetime-iso` or `time-iso`

2. **Use local formats for user-centric times**: When displaying times relative to the user's location, use `datetime-local` or `time-local`

3. **Use US formats for US-specific data**: When displaying data that is inherently tied to US Eastern time (e.g., US market hours), use `datetime-us` or `time-us`

4. **Consider relative time for recent events**: For timestamps within the last few hours or days, `relative-time` provides better user experience

5. **Document timezone assumptions**: When creating dashboards, document which timezone is being used for data interpretation

## Technical Details

### Timezone Detection

The browser's timezone is detected using the JavaScript Internationalization API:

```typescript
const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
```

This provides the IANA timezone identifier (e.g., "America/New_York", "Europe/London", "Asia/Tokyo").

### Locale Detection

The browser's locale is detected with comprehensive fallbacks:

```typescript
const getBrowserLocale = (): string => {
  if (typeof navigator !== 'undefined') {
    if (navigator.language) return navigator.language;
    if (navigator.languages && navigator.languages.length > 0) {
      return navigator.languages[0];
    }
    // Additional fallbacks for older browsers...
  }
  return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
};
```

## Related Documentation

- [Dashboard Configuration](./dashboard.md)
- [Panel Configuration](./plugin.md)
- [Date & Time Units](../api/plugins.md#date-time-units)

## Contributing

As the timezone feature evolves, contributions to this documentation are welcome. Please ensure any updates reflect the actual implementation and include code examples where appropriate.

---

**Last Updated**: This documentation reflects the timezone behavior as of the current codebase state. The `TimeZoneProvider` feature mentioned in the changelog is planned but not yet fully implemented in the configuration system.
