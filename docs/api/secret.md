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

NOTE: Basic Auth, Authorization and OAuth are mutually exclusive.
Use one of the authenticators, do not combine multiple authenticators.

```yaml
basicAuth: <Basic Auth specification> # Optional

# The HTTP authorization credentials for the targets.
authorization: <Authorization specification> # Optional

# The OAuth credentials used to connect to targets.
oauth: <OAuth specification> # Optional

# Config used to connect to the targets.
tlsConfig: <TLS Config specification> # Optional
```

### Basic Auth specification

```yaml
username: <string>
password: <string> # Optional
passwordFile: <filename> # Optional
```

### Authorization specification

```yaml
type: <string> | default = "Bearer" # Optional

# The HTTP credentials like a Bearer token
credentials: <string> # Optional
credentialsFile: <filename> # Optional
```

### OAuth Config specification

```yaml
# ClientID is the application's ID.
clientID: <string>
# ClientSecret is the application's secret.
clientSecret: <string>
clientSecretFile: <filename> # Optional
# TokenURL is the resource server's token endpoint URL. 
# This is a constant specific to each server.
tokenURL: <string> 
# Scopes specifies optional requested permissions.
scopes: 
- <string> # Optional
# EndpointParams specifies additional parameters for requests to the token endpoint.
endpointParams: <map[string][]string> # Optional
# AuthStyle optionally specifies how the endpoint wants the
# client ID & client secret sent. The zero value means to
# auto-detect.
authStyle: <int> # Optional 
```

### TLS Config specification

```yaml
# CA certificate to validate API server certificate with. At most one of ca and ca_file is allowed.
ca: <secret> # Optional
caFile: <filename> # Optional

# Certificate and key for client cert authentication to the server.
# At most one of cert and cert_file is allowed.
# At most one of key and key_file is allowed.
cert: <secret> # Optional
certFile: <filename> # Optional
key: <secret> # Optional
keyFile: <filename> # Optional

# ServerName extension to indicate the name of the server.
# https://tools.ietf.org/html/rfc4366#section-3.1
serverName: <string> # Optional

# Disable validation of the server certificate.
insecureSkipVerify: <boolean> | default = false # Optional
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

- name = `<string>` : filters the list of secrets based on their names (prefix).

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

- name = `<string>` : filters the list of global secrets based on their names (prefix).

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
