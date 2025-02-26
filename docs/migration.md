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

As we are always supporting the last version of Grafana, we advise to have your Grafana dashboard up to date if the
latest version of Grafana.

When we started to develop Perses, the latest version of Grafana was 9.0.0. And since we always have a backward
compatible mind when developing the migration script. So there is a high chance you can migrate your dashboard from an
older version of Grafana. But we can't guarantee it.

## How to migrate

1. First, you need a running instance of Perses. If you don't have one, please refer to
   the [installation documentation](./installation/in-a-container.md).
2. Then, you can either use the CLI or the UI to migrate your dashboard.

### Using the UI

- On the home page, click on the right of the button `add dashboard` and select `import dashboard`.
- Then, you can either paste the JSON of your Grafana dashboard or upload the JSON file.
- Click on the `import` button.
- If the migration is successful, then you will have in return the Perses dashboard as a JSON.
- You can save the JSON or continue on the same page to save this migrated dashboard into the project you would like.
  You need to select the project and click on the `import` button.

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

- As a tip, you may want to open the file and remove any reference to the previous datasource used in Grafana. This
  will allow the dashboard to use the default datasource. Do that only if you want to use the default datasource.

For example:

```json
{
  "datasource": {
    "kind": "PrometheusDatasource",
    "name": "$datasource"
  }
}
```

You can transform it like this:

```json
{
  "datasource": {
    "kind": "PrometheusDatasource"
  }
}
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
