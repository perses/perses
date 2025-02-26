Custom Lint Rules for dashboard
================================

To validate a dashboard, we have implemented a set of rules that are for some executed when unmarshalling a dashboard
from JSON or YAML, for others with Cuelang to validate the plugins used.

To comply with your organization standards, you may need to implement custom rules. This document explains how to do it.

## YAML definitions

These rules are defined in a YAML file that can be used either by the CLI or the API. The file must have the following
structure:

| Field     | Type    | Description                                                                                                                                      | Additional Notes                                      |
|-----------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| name      | string  | Unique identifier for the lint rule.                                                                                                             | Required                                              |
| target    | string  | JSONPath expression to extract the relevant portion of the dashboard data.<br/> Refer to https://goessner.net/articles/JsonPath/ for the syntax. | Required; used to bind the extracted value as `value` |
| assertion | string  | CEL expression that validates the extracted value. <br/> Refer to https://github.com/google/cel-spec/blob/master/doc/langdef.md for the syntax.  | Required; must evaluate to a boolean                  |
| message   | string  | Error message to display if the assertion fails.                                                                                                 | Required                                              |
| disabled  | boolean | Flag indicating whether the rule is active.                                                                                                      | Optional; defaults to `false` if omitted              |

You should take particular attention to the following points:

- `target` can return any kind of value, it doesn't need to be a string. The value will be bound to the `value` variable
  in the `assertion`.
- in the `assertion`, you can use the `value` variable to refer to the extracted value.
- `assertion` must evaluate to a boolean. If it evaluates to `false`, the rule will fail and the `message` will be
  displayed.

Here is an example of a custom lint rule:

```yaml
- name: "Dashboard Naming Convention"
  target: "$.metadata.name"
  assertion: "value.matches('^[a-z]+(-[a-z]+)*$')"
  message: "Dashboard name must be all lowercase letters with hyphens only."
  enabled: false

- name: "At Least One Panel Exists"
  target: "$.spec.panels"
  assertion: "value.size() > 0"
  message: "Dashboard must contain at least one panel."
  disable: false
```

1. For the first rule, the `target`extracts the `name` field from the metadata section of the
   dashboard. So the returned value is a string.
   The `assertion` checks if the value (so the `metadata.name`) matches the regular expression `^[a-z]+(-[a-z]+)*$`,
   which means that
   the name must be all lowercase letters with hyphens only. If the assertion fails, the message "Dashboard name must be
   all lowercase letters with hyphens only." will be displayed.

2. For the second rule, the `target` extracts the `panels` field from the spec section of the dashboard. So the returned
   value is an array.
   The `assertion` checks if the value (so the `spec.panels`) has a size greater than 0. If the assertion fails, the
   message "Dashboard must contain at least one panel." will be displayed.

## API

The custom rules can be added to the Perses configuration file with the entry `dashboard.custom_lint_rules`:

```yaml
dashboard:
  custom_lint_rules:
    - name: "Dashboard Naming Convention"
      target: "$.metadata.name"
      assertion: "value.matches('^[a-z]+(-[a-z]+)*$')"
      message: "Dashboard name must be all lowercase letters with hyphens only."
      disable: false

    - name: "At Least One Panel Exists"
      target: "$.spec.panels"
      assertion: "value.size() > 0"
      message: "Dashboard must contain at least one panel."
      disable: false
```

## CLI

In the command `lint`, you can pass the path to the custom rules file with the flag `--custom-rule.path`. For example:

```shell
percli lint --custom-rule.path /path/to/custom-rules.yaml /path/to/dashboard.yaml
```

where custom-rules.yaml is the array of custom rules as described above.

If you are using the flag `--online`, then the CLI will use the custom-rules defined in the API configuration if it
exists.
