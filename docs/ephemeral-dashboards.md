# Ephemeral Dashboard

## What is it?

The ephemeral dashboard is a standalone dashboard with a time-to-live (TTL), thus and the word ephemeral.
By using this feature, a user can create an actual, but temporary, dashboard, that can be shared between users and will be removed from the database, after a set period of time.

## Why you may need it? 

Ephemeral dashboard addresses the need of having a generated preview of dashboards, as part of the continuous integration with the Dashboard-as-Code (DaC) feature with the dedicated CLI command dac .
```
percli dac
```
Use the ephemeral dashboard feature to visualize a preview of the dashboard you want to modify and make the review of your pull request easier.

## How it works

As a Perses user, you can add the [ephemeral dashboard resource](https://perses.dev/perses/docs/api/ephemeral-dashboard/#ephemeral-dashboard) in your pull request to enable the functionality.
After you can use the [ephemeral dashboard api](https://perses.dev/perses/docs/api/ephemeral-dashboard/#api-definition) to manipulate (create/ update/ delete) a single ephemeral dashboard, along with retrieving one or more existing ones from the database.

## Related Documentation
 - [Ephemeral Dashboard API](https://perses.dev/perses/docs/api/ephemeral-dashboard/)
 - [Perses API Documentation](https://perses.dev/perses/docs/api/)
 - [Dashboard-as-Code User Guide](https://perses.dev/perses/docs/user-guides/dashboard-as-code/)
