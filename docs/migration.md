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

### Variables with a regex

The migration doesn't keep the `Regex` field of a Grafana variable, so the migrated variable lists all the values
returned by its query. Most of the time, the regex wouldn't work in Perses as it is.

In Grafana, a Prometheus query variable hides the Prometheus API. For example, `query_result(<expr>)` returns each
series as a line of text, such as `up{instance="demo:9100",job="node"} 1 1700000000000`, and the regex often extracts a
label value from these lines. Perses doesn't hide the Prometheus API: a
[Prometheus variable](https://perses.dev/plugins/docs/prometheus/#available-variable-plugins) lists label names, or
the values of the label set in its `Label Name` field, which is mandatory.

#### How Prometheus query variables are migrated

The migration converts the Grafana query as follows:

- `label_names()` becomes a `PrometheusLabelNamesVariable`.
- `label_values(<label>)` and `label_values(<series selector>, <label>)` become a `PrometheusLabelValuesVariable`,
  with `<label>` as `Label Name` and `<series selector>`, if any, as `Series Selector`.
- `query_result(<expr>)` becomes a `PrometheusPromQLVariable` that runs `<expr>`, with a label of a `by (...)` clause
  of `<expr>` as `Label Name`: check it, especially when `<expr>` groups by several labels or has several `by (...)`
  clauses. If no label is found this way, for example when there is no `by (...)` clause, the query keeps the
  `query_result(...)` wrapper and the `Label Name` is `migration_from_grafana_not_supported`: remove the wrapper and
  set the `Label Name` yourself.
- Any other query, such as `metrics(<regex>)`, `label_names(<regex>)` or a series selector, becomes the static
  variable shown in [Using the CLI](#using-the-cli). To replace it when the query was a series selector, such as
  `up{job="node"}`, use a `PrometheusLabelValuesVariable` with this selector as `Series Selector` and, as `Label Name`,
  the label whose value the regex extracted, such as `instance` for `/instance="([^"]+)"/`. When the query was
  `metrics(<regex>)`, use a `PrometheusLabelValuesVariable` with `__name__` as `Label Name`, and filter the metric
  names as explained below.

The queries are matched as written, so extra spaces, `BY` in capitals or a label name with a dot can lead to
`migration_from_grafana_not_supported` or to the static variable: check each migrated variable.

#### How to get the same values as in Grafana

- If the regex only extracted the value of a label from the lines of `query_result(<expr>)`, such as
  `/instance="([^"]+)"/`, set the `Label Name` to this label: you don't need a regex anymore. The metric name, at the
  start of a line, is the value of the label `__name__`.
- If the regex extracted the sample value, the first number after the labels, as `/.* ([^\ ]*) .*/` does, no label
  holds it: use `count_values("value", <expr>)` as the query, and `value` as the `Label Name`. `count_values` returns
  one series for each distinct value of `<expr>`, with this value in its label `value`. If `<expr>` returns a scalar,
  which Grafana lists as a single value, use `count_values("value", vector(<expr>))`.
- To keep only some values of the `Label Name`, add a matcher on this label to the query or to the `Series Selector`,
  such as `kube_pod_info{namespace=~"prod-.*"}` instead of `kube_pod_info` when the `Label Name` is `namespace`.
  Prometheus then keeps only the series whose label matches the
  [regular expression](https://prometheus.io/docs/prometheus/latest/querying/basics/#regular-expressions) of the
  matcher.
    - The regular expression uses the RE2 syntax, must match the whole label value, and can start with `(?i)` to
      ignore the case.
    - RE2 doesn't support lookarounds such as `(?!...)`: to exclude values, use a negative matcher instead, such as
      `kube_pod_info{namespace!~"kube-.*"}`. Without a metric name, a selector needs a matcher that doesn't match an
      empty value, so Prometheus rejects `{namespace!~"kube-.*"}`: write `{namespace=~".+",namespace!~"kube-.*"}`
      instead.
    - Put the matcher in the existing `Series Selector`, if there is one: a second `Series Selector` can only add
      values, because Prometheus lists the values of each one and merges them.
    - A matcher selects series: on a `PrometheusLabelNamesVariable`, it keeps the names of the selected series, but
      it can't keep only the names that match a regex.
- Otherwise, or to filter label names, set the `Capturing Regexp Filter` of the variable (`capturingRegexp` in the
  [list variable specification](./api/variable.md#list-variable-specification)). Like the regex of Grafana, it's a
  JavaScript regular expression that your browser applies to each value, but:
    - Write it without the `/` delimiters and flags. To ignore the case, put both cases of each letter in a character
      class, such as `[Pp][Rr][Oo][Dd]`: `(?i)` is invalid in JavaScript. It isn't anchored, while Grafana anchors a
      regex written without `/`. Variables such as `$env` aren't replaced in it, while they are in a matcher.
    - It must capture something: a value is kept only if a group captures some text, and the new value is the text
      captured by all the groups, put together. So `^prod-.*` removes every value: write `^(prod-.*)` instead. Grafana
      uses only the first group, so write the other groups as non-capturing groups, such as `(?:eu|us)`. Groups named
      `text` or `value` have no special meaning.
    - It's always global: it uses every match in the value, not only the first one, and puts their captured text
      together. So `([^:]+)` turns `demo:9100` into `demo9100`, while Grafana's `/([^:]+)/` gives `demo`. To use only
      the first match, anchor it with `^`, and match what comes before the group if needed, such as `^([^:]+)`, or
      `^\D*(\d+)` for the first number.
    - To only filter, make the group capture the whole value, such as `^(prod-.*)` or `(.*prod-.*)`: a group around
      a part of the value keeps only this part, so `(prod-.*)` turns `preprod-x` into `prod-x`.

!!! tip
    To check a `Capturing Regexp Filter`, click `Run Query` in the variable editor. `Preview Values` lists one entry
    per captured text. Like the dropdown of the dashboard, each entry shows the first original value that gave this
    text, while the value of the variable, used in the queries, is the captured text.

#### Example

A Grafana variable with the query `query_result(group by (ifAlias) (ifHCInOctets))` and the regex
`.*ifAlias="Prov: ([^,]+),.*` gets `ACME` from the line `{ifAlias="Prov: ACME, 10G"} 1 1700000000000`. The migrated
variable lists the values of the `ifAlias` label instead, such as `Prov: ACME, 10G`. To use `ACME` in the queries
again, keep only the part of the regex that matches the start of the label value, `Prov: ([^,]+),`, and anchor it
with `^`:

```yaml
kind: ListVariable
spec:
  name: provider
  capturingRegexp: "^Prov: ([^,]+),"
  plugin:
    kind: PrometheusPromQLVariable
    spec:
      expr: group by (ifAlias) (ifHCInOctets)
      labelName: ifAlias
```

With this filter, the dropdown still shows `Prov: ACME, 10G`, and the queries get `ACME` (see the tip above).
