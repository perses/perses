# Ephemeral Dashboard

## What it is

An ephemeral dashboard is a standalone dashboard with a time-to-live (TTL), which is why it's referred to as 'ephemeral'.

Using this feature, a user can create a real, but temporary, dashboard, that can be shared with others and will be automatically removed from the database, after a specified period.

## Why you might need it

The Ephemeral Dashboard resource addresses the need of generating preview dashboards when working with [Dashboard-as-Code](./dac/introduction.md). 


## How it can be used
### In the CLI:
The ephemeral dashboard was introduced with the continuous integration use-case in mind, hence why it integrates with [percli](./cli.md).

```bash
$ percli dac preview -h

Creates ephemeral dashboard(s) based on the dashboard(s) built locally. As a response it provides a list with the URL of each dashboard preview generated.

Usage:

 $ percli dac preview (-f [FILENAME] | -d [DIRECTORY_NAME]) [flags]

Examples:

$ percli dac preview -d ./build
```


### In the Perses UI:
To use the ephemeral dashboard in Perses UI:

1. Login in Perses UI using your account
2. Go to your own project (if you don't have an existing project, you need to create one)
3. Go to the dashboard of the project where you want to create an ephemeral copy
4. Press the "Duplicate" button
5. Enable the "Create as a temporary copy" option

    ![temporary copy](https://github.com/user-attachments/assets/3d2cb1e6-958e-42d2-8964-4419b7490653)

6. Provide the name and time-to-live (TTL) for the new ephemeral dashboard
7. Save your changes
8. To view your dashboard, go in your project and click on the ephemeral dashboard tab, that appears automatically when there is an ephemeral dashboard available

    ![ephemeral dashboard tab](https://github.com/user-attachments/assets/0fa7d9d1-702e-4af3-b9b3-7c34444ab1ef)

## Related Documentation
 - [Ephemeral Dashboard API](./api/ephemeral-dashboard.md)
 - [Perses CLI](./cli.md)
 - [Dashboard-as-Code user guide](./dac/getting-started.md) 
 - [GitHub Actions library](https://github.com/perses/cli-actions)   
