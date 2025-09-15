# Ephemeral Dashboard

An ephemeral dashboard is like a regular dashboard but with a time-to-live (TTL), which is why it's referred to as 'ephemeral'.

Using this feature, a user can create a real, but temporary, dashboard, that can be shared with others and will be automatically removed from the database, after a specified period.

## Why you might need it

Ephemeral Dashboards were initially introduced to address the need of generating preview dashboards when working with [Dashboard-as-Code](../concepts/dashboard-as-code.md). Besides, other usages could be considered: temporary dashboard clone to better manage or share info around an ongoing incident, or simply to create a playground dashboard you won't have to remember to clean up later.

## How it can be used

### Using the CLI:

Ephemeral dashboards were designed with continuous integration in mind, hence why it integrates with [percli](../cli.md).

```bash
$ percli dac preview -h

Creates ephemeral dashboard(s) based on the dashboard(s) built locally. As a response it provides a list with the URL of each dashboard preview generated.

Usage:

 $ percli dac preview (-f [FILENAME] | -d [DIRECTORY_NAME]) [flags]

Examples:

$ percli dac preview -d ./build
```

It's thus also integrated in the [standard workflow for Dashboard-as-Code](https://github.com/perses/cli-actions/blob/main/README.md#dac) since it relies on percli.

### Using the UI:

When duplicating a dashboard in the Perses UI, you have the possibility to make it ephemeral by providing a time-to-live (TTL):

![temporary copy](https://github.com/user-attachments/assets/3d2cb1e6-958e-42d2-8964-4419b7490653)

When a project contains ephemeral dashboards, a new dedicated tab appears in the project view:

![ephemeral dashboard tab](https://github.com/user-attachments/assets/0fa7d9d1-702e-4af3-b9b3-7c34444ab1ef)

## Related Documentation
- [Ephemeral Dashboard API](../api/ephemeral-dashboard.md)
- [Perses CLI](../cli.md)
- [Dashboard-as-Code user guide](../dac/getting-started.md)
- [GitHub Actions library](https://github.com/perses/cli-actions)
