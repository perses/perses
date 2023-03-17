# DateTimeRangePicker

Date & time selection component to customize what data renders on dashboard. This include relative shortcuts and the ability to pick absolute start and end times. MUI has plans to build a component similar to this in the future (see [mui/mui-x/issues/4547](https://github.com/mui/mui-x/issues/4547)), but for now this gives us full control and builds on top of MUI's StaticDateTimePicker.

## Usage

```tsx
<DateTimeRangePicker value={timeRange} onChange={setTimeRange} timeOptions={TIME_OPTIONS} />
```

## Props

| Name        | Description                                                |
|-------------|------------------------------------------------------------|
| timeOptions | List of supported shortcuts to show in the select dropdown |
| value       | Current dashboard time range                               |
| onChange    | Used to update active dashboard time range                 |
