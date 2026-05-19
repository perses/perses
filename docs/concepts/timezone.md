# Timezone Resolution

Perses supports multiple levels of timezone configuration to provide flexibility in how timestamps are displayed across dashboards and panels.

## Overview

Timezone configuration in Perses determines how date and time values are formatted and displayed throughout the application. The system uses a resolution hierarchy to determine which timezone to apply when formatting timestamps.

!!! note
    This documentation describes the current timezone behavior and the planned multi-level configuration system. As Perses evolves to support multiple configuration levels, this document will be updated to reflect the implementation details.

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

1. **Format-Specific Override**: If the date format unit has a hardcoded timezone (e.g., `datetime-us`, `time-iso`), that timezone is always used.
2. **Explicit `timeZone` Parameter**: If a `timeZone` parameter is provided in the format options, it is used for formats that support it.
3. **Browser Default**: For local formats or when no timezone is specified, the browser's detected timezone is used.

### Format Options

When formatting dates, the following options are available:

- **`unit`**: The date format unit to use (default: `datetime-local`)
- **`locale`**: The locale for formatting (default: browser's locale)
- **`timeZone`**: The timezone to use for formatting (default: browser's timezone)
- **`referenceTime`**: Reference time for relative formatting (default: current time)

## Future Enhancements

Perses plans to support a multi-level timezone configuration system. The following levels are expected (in order of precedence, highest to lowest):

1. **Panel-Level**: Timezone specified directly on a panel
2. **Dashboard-Level**: Timezone specified for an entire dashboard
3. **User Preference**: User's personal timezone preference set in their profile
4. **Project-Level**: Default timezone for a project
5. **Global Configuration**: System-wide default configured on the Perses server
6. **Browser Default**: Fallback to the browser's detected timezone

!!! note
    These configuration levels are still being developed. This document will be updated as the feature evolves.

## Best Practices

1. **Use ISO formats for UTC times**: When displaying absolute timestamps that should be consistent across all users, use `datetime-iso` or `time-iso`.
2. **Use local formats for user-centric times**: When displaying times relative to the user's location, use `datetime-local` or `time-local`.
3. **Use US formats for US-specific data**: When displaying data tied to US Eastern time (e.g., US market hours), use `datetime-us` or `time-us`.
4. **Consider relative time for recent events**: For timestamps within the last few hours or days, `relative-time` provides a better user experience.
5. **Document timezone assumptions**: When creating dashboards, document which timezone is being used for data interpretation.

## Troubleshooting

### Common Issues

**Issue**: Timestamps are displayed in an unexpected timezone

**Solution**: Check the timezone resolution hierarchy:

1. Verify if the panel has a timezone configured
2. Check the dashboard timezone setting
3. Review your user timezone preference
4. Check the project default timezone
5. Verify the global server configuration
6. Confirm your browser's timezone detection

**Issue**: Date format unit doesn't respect timezone setting

**Solution**: Some date format units have fixed timezones:

- `datetime-iso`, `date-iso`, `time-iso` always use UTC
- `datetime-us`, `date-us`, `time-us` always use US Eastern time
- Use `datetime-local`, `date-local`, or `time-local` for timezone-aware formatting

## Related Documentation

- [Dashboard Configuration](./dashboard.md)
- [Panel Configuration](./plugin.md)
- [Date & Time Units](../api/plugins.md#date-time-units)
