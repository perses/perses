# Secret

When defining a datasource, you will probably need to provide a basic authentication, a certificate, or a token to be
used when the Perses backend will contact your Datasource.

We have two different objects to store sensitive data: `GlobalSecret` and `Secret`.
You should use one or the other depending on which object your datasource corresponds to.

- To store sensitive data for a `GlobalDatasource`, you need to create a `GlobalSecret`.
- For a `Datasource` object or a datasource defined directly in a dashboard, you need to create a `Secret`. `GlobalSecret` cannot be used here.

A `Secret` is defined like that:

```yaml
kind: "Secret"
metadata:
  project: <string>
  name: <string>
spec: <secret_specification>
```

And a `GlobalSecret`:

```yaml
kind: "GlobalSecret"
metadata:
  name: <string>
spec: <secret_specification>
```

See the next section to get details about the `<secret_specification>`

## Secret specification

```yaml
  [ basicAuth: <basic_auth_spec> ]

  # The HTTP authorization credentials for the targets.
  # Basic Auth and authorization are mutually exclusive. Use one or the other not both at the same time.
  [ authorization: <authorization_spec> ]

  # Config used to connect to the targets.
  [ tlsConfig: <tls_config_spec> ]
```

### `<basic_auth_spec>`

```yaml
  username: <string>
  [ password: <string> ]
  [ passwordFile: <filename> ]
```

### `<authorization_spec>`

```yaml
  [ type: <string> | default = "Bearer" ]

  # The HTTP credentials like a Bearer token
  [ credentials: <string> ]
  [ credentialsFile: <filename> ]
```

### `<tls_config_spec>`

```yaml
  # CA certificate to validate API server certificate with. At most one of ca and ca_file is allowed.
  [ ca: <secret> ]
  [ caFile: <filename> ]

  # Certificate and key for client cert authentication to the server.
  # At most one of cert and cert_file is allowed.
  # At most one of key and key_file is allowed.
  [ cert: <secret> ]
  [ certFile: <filename> ]
  [ key: <secret> ]
  [ keyFile: <filename> ]

  # ServerName extension to indicate the name of the server.
  # https://tools.ietf.org/html/rfc4366#section-3.1
  [ serverName: <string> ]

  # Disable validation of the server certificate.
  [ insecureSkipVerify: <boolean> | default = false ]
```

### Example

```yaml
kind: "Secret"
metadata:
  project: <string>
  name: <string>
spec:
  authorization:
    type: "Bearer"
    credentials: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  tlsConfig:
    insecureSkipVerify: false
```

## API definition

### `Secret`

#### Get a list of `Secret`

```bash
GET /api/v1/projects/<project_name>/secrets
```

URL query parameters:

- name = `<string>` : should be used to filter the list of secrets based on the prefix name.

#### Get a single `Secret`

```bash
GET /api/v1/projects/<project_name>/secrets/<secret_name>
```

#### Create a single `Secret`

```bash
POST /api/v1/projects/<project_name>/secrets
```

#### Update a single `Secret`

```bash
PUT /api/v1/projects/<project_name>/secrets/<secret_name>
```

#### Delete a single `Secret`

```bash
DELETE /api/v1/projects/<project_name>/secrets/<secret_name>
```

### Global `Secret`

#### Get a list of global `Secret`

```bash
GET /api/v1/globalsecrets
```

URL query parameters:

- name = `<string>` : should be used to filter the list of secret based on the prefix name.

#### Get a single global `Secret`

```bash
GET /api/v1/globalsecrets/<name>
```

#### Create a single global `Secret`

```bash
POST /api/v1/globalsecrets
```

#### Update a single global `Secret`

```bash
PUT /api/v1/globalsecrets/<name>
```

#### Delete a single global `Secret`

```bash
DELETE /api/v1/globalsecrets/<name>
```
