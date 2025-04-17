# Migrate

The Perses server provides an API endpoint to validate various resources.

## API definition

```bash
POST /api/validate/:resourceType
```

The endpoint is available for the following resource types (paths):
- `dashboards`
- `datasources`
- `globaldatasources`
- `variables`
- `globalvariables`

The request body should contain a resource of the right type.

No query parameters.

No response body. The server returns an HTTP 200 status code if the validation is successful.
