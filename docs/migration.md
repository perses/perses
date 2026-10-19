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

- The `Regex` field of the Grafana variables is not migrated. See [Variables with a regex](#variables-with-a-regex) to
  learn why, and how to filter the values of a migrated variable again.

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

### After the migration

#### Variables with a regex

The migration doesn't keep the `Regex` field of a Grafana variable: the migrated variable lists all the values
returned by its plugin.

This is because a Grafana regex is written against the values as the Grafana datasource returns them. The
corresponding Perses variable plugin often returns different values, because it doesn't query the datasource the
same way. Applying the original regex as it is would then give wrong or empty results without any warning.

To filter the values of a migrated variable again, you can:

- Filter in the query itself, if the datasource supports it. This is usually the simplest and most efficient option.
  How to do it depends on the plugin. Check its documentation, for example
  [Migrating variables from Grafana](https://perses.dev/plugins/docs/prometheus/#migrating-variables-from-grafana)
  for Prometheus.
- Set the [Capturing Regexp Filter](#using-the-capturing-regexp-filter) of the variable. It works with any variable
  plugin.

!!! tip
    To see the values returned by a migrated variable, click `Run Query` in the variable editor and check
    `Preview Values`. Write your filter based on these values, not on the values Grafana showed.

##### Using the Capturing Regexp Filter

The `Capturing Regexp Filter` of a variable (`capturingRegexp` in the
[list variable specification](./api/variable.md#list-variable-specification)) is, like the regex of Grafana, a
JavaScript regular expression that your browser applies to each value. However:

- Write it without the `/` delimiters and flags. To ignore the case, put both cases of each letter in a character
  class, such as `[Pp][Rr][Oo][Dd]`: `(?i)` is invalid in JavaScript. It isn't anchored, while Grafana anchors a regex
  written without `/`. Variables such as `$env` aren't replaced in it.
- It must capture something: a value is kept only if a group captures some text, and the new value is the text
  captured by all the groups, put together. So `^prod-.*` removes every value: write `^(prod-.*)` instead. Grafana
  uses only the first group, so write the other groups as non-capturing groups, such as `(?:eu|us)`. Groups named
  `text` or `value` have no special meaning.
- It's always global: it uses every match in the value, not only the first one, and puts their captured text
  together. So `([^:]+)` turns `demo:9100` into `demo9100`, while Grafana's `/([^:]+)/` gives `demo`. To use only
  the first match, anchor it with `^`, and match what comes before the group if needed, such as `^([^:]+)`, or
  `^\D*(\d+)` for the first number.
- To only filter, make the group capture the whole value, such as `^(prod-.*)` or `(.*prod-.*)`: a group around a
  part of the value keeps only this part, so `(prod-.*)` turns `preprod-x` into `prod-x`.

!!! note
    `Preview Values` lists one entry per captured text. Like the dropdown of the dashboard, each entry shows the first
    original value that gave this text, while the value of the variable, used in the queries, is the captured text.

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

As each plugin migrates its own variables, panels and queries, check the documentation of the plugin for details
on what is migrated and what to adjust afterwards.
