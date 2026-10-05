Migrate from Grafana
====================

Migrating from Grafana to Perses means to be able to translate the Grafana dashboards to Perses dashboards (in terms of
data model). This documentation will guide you through the process of doing such migration.

## ⚠️ Disclaimers

- As the title indicates, Grafana is the only supported source for migration currently. If you use another tool and would like to migrate to Perses, see the [contribution guide](https://github.com/perses/perses/blob/main/CONTRIBUTING.md) for how to raise your request.

- Perses can't migrate Grafana resources like alerts, users, etc. Only the migration of dashboards is supported.

- The challenge around the migration process is to be able to translate the various Grafana plugins to the ones supported by
Perses. Since Perses is much younger project than Grafana, it is certain that it doesn't support every possible
plugin. Therefore, the migration is in best-effort basis. However we are working hard to expand coverage!

## Prerequisites

We are trying to support as many versions of Grafana as possible. But unfortunately, we can't support all of them. 
Specially the latest versions of Grafana where the data model has changed a lot.

The migration script is working for Grafana versions 9.0.0 until the version 11.x. Above or below this range, we cannot guarantee the migration will work.

We aim to support the latest version of Grafana and we will try to support the Datadog format as well.
If you are interesting in this, you can track the associated issue: https://github.com/perses/perses/issues/4307

## How to migrate

1. First, you need a running instance of Perses. If you don't have one, please refer to
   the [installation documentation](./installation/in-a-container.md).
2. Then, you can either use the CLI or the UI to migrate your dashboard.

### Using the UI

- On the home page, click on the `Import Dashboard` in the top right corner.

- Then, you can either paste the JSON of your Grafana dashboard or upload the JSON file.
!!! tip
    If you want the migrated dashboard to use the default Perses datasource, check the
    `Use default datasource in Perses` checkbox. This will remove any reference to a specific
    datasource in the migrated dashboard.

- Click on the `Migrate` button.
- If the migration is successful, then you will have in return the Perses dashboard as a JSON.
- You can save the JSON or continue on the same page to save this migrated dashboard into the project you would like.
  You need to select the project and click on the `Import` button.

### Using the CLI

- Install the CLI by following the [installation documentation](./cli.md).
- Login the CLI to the Perses instance

```bash
percli login http://localhost:8080
```

- Then, you can use the `migrate` command to migrate your dashboard. We recommend using the `--online` flag to be sure
  that the migration is done with the latest version of the plugins.

```bash
percli migrate -f grafana-dashboard.json --online -o json > perses-dashboard.json
```

Note: In case you would like to have the result as a K8s CustomResource, you can use the `--format` flag with the value `cr`.

!!! tip
    If you want the migrated dashboard to use the default Perses datasource, you can use the
    `--use-default-datasource` flag. This will remove any reference to a specific datasource in the migrated dashboard.

    ```bash
    percli migrate -f grafana-dashboard.json --online --use-default-datasource -o json > perses-dashboard.json
    ```

- You should check the unsupported migrations. For example, in case of a variable, you will get a static variable like this:

```json
{
  ...
  "plugin": {
    "kind": "StaticListVariable",
    "spec": {
      "values": [
        "grafana",
        "migration",
        "not",
        "supported"
      ]
    }
  },
  ...
}
```

- Then, if you are happy with the result, you can import the JSON into Perses using the UI or the CLI. With the CLI, you
  can use the command `apply`:

```bash
percli apply -f perses-dashboard.json --project my-project
```

## What is migrated

Besides the dashboard name, tags, links and layout, and the panels, queries and variables (see
[How it works](#how-it-works)), the migration keeps the following settings of the Grafana dashboard.

### Time settings

- **Time range**: a time range relative to now, from `now-<duration>` to `now`, becomes the default duration of the
  Perses dashboard (e.g. `now-6h` → `6h`). Perses has no month or quarter unit, so a month counts as 30 days and a
  quarter as 90 days (e.g. `now-6M` → `180d`). Years are converted into days too (e.g. `now-1y` → `365d`), because a
  PersesDashboard Kubernetes resource doesn't accept the `y` unit. The default time range of a Perses dashboard always
  ends at now, so a range that ends before now, such as `now-6h` to `now-5m` (a delay for late data), keeps its start
  (`6h`). A dashboard without a time range gets `6h`, like in Grafana. Any other time range, such as absolute dates, a
  rounded range like `now-1d/d`, or a range that ends in the future, is replaced by `1h`.
- **Auto-refresh**: the refresh interval is kept (e.g. `1m`). When auto-refresh is off, or set to a value that isn't a
  duration (e.g. `auto`), the Perses dashboard has no auto-refresh.
- **Timezone**: `utc` becomes `UTC`, and an IANA timezone (e.g. `Europe/Paris`) is kept. Any other value, such as
  `browser` or the empty (default) value, is not migrated: the Perses dashboard then follows the
  [timezone resolution hierarchy](./concepts/timezone.md#resolution-hierarchy) (user preference, server default, then
  browser).

## To go further

### How it works

As you might now, the Perses dashboard specification is written combining Golang and Cuelang.
We rely on Cuelang for the data model of the plugins. It allows us to have a dynamic and
extensible specification.

The migration process is done in two parts:

1. Import the Grafana Dashboard into a Golang structure and then migrate it to the Perses Golang structure.
2. For each variable, panels and queries in the Grafana dashboard, we are executing a Cuelang script coming
   from the plugin itself, if, of course, the plugin is supported. This script will generate the piece of the Perses
   data model for the corresponding plugin.

If you need more information about how to write a migration script in Golang for a plugin, please refer to
the [associated documentation](./plugins/cue.md#migration-from-grafana).
