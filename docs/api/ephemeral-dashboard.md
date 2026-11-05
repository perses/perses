# Ephemeral Dashboard

It's a dashboard but with a TTL. That means after a defined duration, the dashboard will be removed from the database.

We are providing this resource mainly to create a dashboard preview from a pull request.

```yaml
kind: "EphemeralDashboard"
metadata:
  name: <string>
  project: <string>
spec: <ephemeral_dashboard_specification>
```

See the next section to get details about the `<ephemeral_dashboard_specification>`.

## Ephemeral Dashboard specification

It's a merge with the [dashboard_spec](./dashboard.md#dashboard-specification) and an additional field `ttl`.

```yaml
ttl: <duration>
  <dashboard_spec>
```

## API definition

### Get a list of `EphemeralDashboard`

```bash
GET /api/v1/projects/<project_name>/ephemeraldashboards
```

URL query parameters:

- name = `<string>` : filters the list of ephemeral dashboards based on their name (prefix match).

### Get a single `EphemeralDashboard`

```bash
GET /api/v1/projects/<project_name>/ephemeraldashboards/<ephemeraldashboard_name>
```

### Create a single `EphemeralDashboard`

```bash
POST /api/v1/projects/<project_name>/ephemeraldashboards
```

### Update a single `EphemeralDashboard`

```bash
PUT /api/v1/projects/<project_name>/ephemeraldashboards/<ephemeraldashboard_name>
```

### Delete a single `EphemeralDashboard`

```bash
DELETE /api/v1/projects/<project_name>/ephemeraldashboards/<ephemeraldashboard_name>
```
