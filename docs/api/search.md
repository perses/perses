# Search

The Perses server provides an API endpoint to search the dashboards, used by the search bar of the UI.

The dashboards are searched through the fields configured in the [search configuration](../configuration/configuration.md#search-config).
Only the dashboards the user has the permission to read are returned.

## API definition

```bash
GET /api/v1/search/dashboards
```

URL query parameters:

- `query` = `<string>`: the text to search. When empty, every dashboard is returned, without any matching information.
- `project` = `<string>`: searches only the dashboards of the given project.

The response is a list of search results:

```yaml
# The metadata of the dashboard.
metadata:
  name: <string>
  project: <string>
  [ tags: <list of string> ]

# The display name of the dashboard, or its name when it has no display name.
displayName: <string>

# The following fields are only set when a query is provided.

# The value of the field matching the query.
[ original: <string> ]

# The index key, as configured in the search configuration, the matching value has been extracted from.
# For example: `spec.panels.@dig:display.name`.
[ key: <string> ]

# The location of the matching value in the dashboard as stored in the database, as a list of object keys and array indexes.
# For example: `["spec", "panels", "MyPanel", "spec", "display", "name"]`.
# It may differ from the dashboard returned by the API when the database has been modified without the API:
# for example, the API returns the tags sorted, so the position of a tag may differ in a dashboard file edited by hand.
# It is not set when the index key uses a syntax for which the location can't be determined:
# wildcards, queries, multipaths, pipes, modifiers other than `@dig`, a `@dig` argument starting with `{`, `[` or `"`,
# and numbers with leading zeros, such as `metadata.tags.01`.
# It is not set either when the value has been found inside a string, which gjson does for some keys:
# for example, `@dig:0` finds `1` in the string `"[1]"`.
[ path: <list of string> ]

# The position of the characters matching the query in the matching value.
[ intervals: <list of Interval> ]

# The score of the match: the higher, the better.
[ score: <int> ]
```

### Interval specification

```yaml
# The position, in bytes, of the first matching character.
from: <int>

# The position, in bytes, of the last matching character.
to: <int>
```
