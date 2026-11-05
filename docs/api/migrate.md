# Migrate

The Perses server provides an API endpoint to migrate a Grafana dashboard to a Perses dashboard.

⚠️ This API call only provides the result of the migration in the server response, it doesn't store the migrated dashboard.

## API definition

```bash
POST /api/migrate
```

The request body should look like the following:

```json5
{
    "grafanaDashboard": {
        // Grafana dashboard JSON
    },
    "input": { // Optional
        // List of key + string value for the variables to be replaced, see https://www.bookstack.cn/read/grafana-9.0-en/fa956e3804e7c04a.md
    }
}
```

No query parameters.

If the request is successful, the server returns the corresponding Perses dashboard.
