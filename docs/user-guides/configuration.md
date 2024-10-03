# Configuration

Perses is configured via command-line flags and a configuration file

## Flags available

```bash
  -config string
        Path to the yaml configuration file for the api. Configuration can be overridden when using the environment variable
  -log.level string
        log level. Possible value: panic, fatal, error, warning, info, debug, trace (default "info")
  -log.method-trace
        include the calling method as a field in the log. Can be useful to see immediately where the log comes from
  -web.hide-port
        If true, it won t be print on stdout the port listened to receive the HTTP request
  -web.listen-address string
        The address to listen on for HTTP requests, web interface and telemetry. (default ":8080")
  -web.telemetry-path string
        Path under which to expose metrics. (default "/metrics")
```

Example:

```bash
perses --config=./config.yaml --log.method-trace
```

## Configuration File

This service can be configured using a yaml file or the environment variable.

Note: you can use both, environment variable will override the yaml configuration.

```yaml
database:
  file: # the configuration when you want to use the filesystem as a database. Note that you can configure it using the flags, which gives you the choice to not create a configuration file just for that.
    folder: "/path/to/the/database/storage" # It's the path where the file will be read/ stored
    extension: "yaml" # The extension of the files read / stored. "yaml" or "json" are the only extension accepted. Yaml is the default one
```

Note: to have the corresponding environment variable you just have to contact all previous key in the yaml and put it in
uppercase. Every environment variable for this config are prefixed by `PERSES`

For example, the environment variable corresponding to the file extension of the file DB would be:

```bash
PERSES_DATABASE_FILE_EXTENSION=yaml
```

### Definition

The file is written in YAML format, defined by the scheme described below. Brackets indicate that a parameter is optional.

Generic placeholders are defined as follows:

* `<boolean>`: a boolean that can take the values `true` or `false`
* `<duration>`: a duration matching the regular expression `((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)`, e.g. `1d`, `1h30m`, `5m`, `10s`
* `<filename>`: a valid path in the current working directory
* `<path>`: a valid URL path
* `<int>`: an integer value
* `<secret>`: a regular string that is a secret, such as a password
* `<string>`: a regular string
* `<kind>`: a string that can take the values `Dashboard`, `Datasource`, `Folder`, `GlobalDatasource`, `GlobalRole`, `GlobalRoleBinding`, `GlobalVariable`, `GlobalSecret`, `Project`, `Role`, `RoleBinding`, `User` or `Variable` (not case-sensitive)

```yaml
# Use it in case you want to prefix the API path. By default the API is served with the path /api. 
# With this config, it will be served with the path <api_prefix>/api
[ api_prefix: <string> ]
  
# It contains any configuration that changes the API behavior like the endpoints exposed or if the permissions are activated.
[ security: <Security config> ]

# Database configuration 
[ database: <Database config> ]

# The configuration to access the CUE schemas
[ schemas: <Schemas config> ]

# If provided, Perses server will look to the different folders configured and populate the database based on what it is found
# Be careful: the data coming from the provisioning folder will totally override what exists in the database.
[ provisioning: <Provisioning config> ]

# If provided, Perses server will generate a list of global datasource based on the discovery chosen.
# Be careful: the data coming from the discovery will totally override what exists in the database.
# Note that this is an experimental feature. Behavior and config may change in the future.
global_datasource_discovery:
  [- <GlobalDatasourceDiscovery config> ]

# The interval at which to trigger the cleanup of ephemeral dashboards, based on their TTLs.
# This config is deprecated. Please use the config ephemeral_dashboard instead.
[ ephemeral_dashboards_cleanup_interval: <duration> ]

# The config for the ephemeral dashboard feature. This is the way to activate the feature.
[ ephemeral_dashboard: < EphemeralDashboard config > ]

# Any configuration related to the UI itself
[ frontend: <Frontend config]
```

### Security config

```yaml
# A flag that will disable any HTTP POST, PUT and DELETE endpoint in the API.
# It will also change the UI to reflect this config, by removing any action button and will prevent the access to a form.
[ readonly: <boolean> | default = false ]
  
# Cookie configuration
[ cookie: <Cookie config> ]
  
# It contains the config regarding the time to live of the refresh/access token.
[ authentication: <Authentication config> ]

# It contains any configuration that changes authorization behavior like default permissions
[ authorization: <Authorization config> ]

# When it is true, the authentication and authorization config are considered.
# And you will need a valid JWT token to contact most of the endpoints exposed by the API
[ enable_auth: <boolean> | default = false ]

# The secret key used to encrypt and decrypt sensitive data stored in the database such as the password of the basic auth for a datasource.
# Note that if it is not provided, it will use a default value.
# On a production instance, you should set this key.
# Also note the key size must be exactly 32 bytes long as we are using AES-256 to encrypt the data.
[ encryption_key: <secret> ]

# The path to the file containing the secret key.
[ encryption_key_file: <filename> ]
```

### Cookie config

```yaml
# Set the same_site cookie attribute and prevents the browser from sending the cookie along with cross-site requests.
# The main goal is to mitigate the risk of cross-origin information leakage.
# This setting also provides some protection against cross-site request forgery attacks (CSRF)
[ same_site: < enum | possibleValue = 'strict' | 'lax' | 'none' > | default = lax ]

# Set to true if you host Perses behind HTTPS. Default is false
[ secure: <boolean> | default = false ]
```

#### Authentication config

```yaml
# It is the time to live of the access token. By default, it is 15 minutes.
[ access_token_ttl: <duration> | default = 15min ]

# It is the time to live of the refresh token. The refresh token is used to get a new access token when it is expired.
# By default, it is 24 hours.
[ refresh_token_ttl: <duration> | default = 24h ]

# With this attribute, you can deactivate the Sign-up page which induces the deactivation of the endpoint that gives the possibility to create a user.
[ disable_sign_up: <boolean> | default = false ]

# Authentication providers
[ providers: <Authentication providers> ]
```

##### Authentication providers

Check the [helpers](./oauth-configuration-helpers.md) to help you to configure the different providers.

```yaml
# Enable the native authentication providers
[ enable_native: <boolean> | default = false ]

# List of the OIDC authentication providers
oidc:
  - [ <OIDC provider> ]
# List of the OIDC authentication providers
oauth:
  - [ <OAuth provider> ]
```

##### OIDC provider

```yaml
# The id of the provider that will be used in the URLs (must be unique for all providers)
slug_id: <string>

# A verbose name for the provider. Will be used to visually identify it in the frontend.
name: <string>

# The Client ID of the Perses application into the provider
client_id: <secret>

# The Client Secret of the Perses application into the provider
client_secret: <secret>

device_code:
  # Allow to use a different Client ID for the device code flow
  [ client_id: <secret> ]
  # Allow to use a different Client Secret for the device code flow
  [ client_secret: <secret> ]

# The callback URL for authorization code (Have to be <your URL> + /api/auth/providers/oidc/{slug}/callback)
# If not set it will get it from the request.
[ redirect_uri: <string> ]

# The needed scopes to authenticate a user in the provider. It's not mandatory because it will depend on the provider
scopes:
  - [ <string> ]

# The provider issuer URL
issuer: <string>

# A custom discovery URL if different from {issuer}/.well-known/openid-configuration
[ discovery_url: <string> ]

# Disable PKCE verification
[ disable_pkce: <boolean> | default = false ]

# The additional url params that will be appended to /authorize provider's endpoint
url_params:
  [ <string>: [<string>, ...] ]
```

##### OAuth provider

```yaml
# The id of the provider that will be used in the URLs (must be unique for all providers)
slug_id: <string>

# A verbose name for the provider. Will be used to visually identify it in the frontend.
name: <string>

# The Client ID of the Perses application into the provider
client_id: <secret>

# The Client Secret of the Perses application into the provider
client_secret: <secret>

device_code:
  # Allow using a different Client ID for the device code flow
  [ client_id: <secret> ]
  # Allow using a different Client Secret for the device code flow
  [ client_secret: <secret> ]
  # Allow using different Scopes for the device code flow
  scopes:
    - [ <string> ]

client_credentials:
  # Allow using a different Client ID for the client credentials flow
  [ client_id: <secret> ]
  # Allow using a different Client Secret for the client credentials flow
  [ client_secret: <secret> ]
  # Allow using different Scopes for the client credentials flow
  scopes:
    - [ <string> ]

# The callback URL for authorization code (Have to be <your URL> + /api/auth/providers/oidc/{slug}/callback)
[ redirect_uri: <string> ]

# The needed scopes to authenticate a user in the provider
scopes:
  - [ <string> ]

# The provider Authorization URL
auth_url: <string>

# The provider Token URL
token_url: <string>

# The provider User Infos URL
user_infos_url: <string>

# The provider Device Auth URL
# If we want to use the device code flow, we need to provide this URL, otherwise an error will fire saying
# it's not supported.
[ device_auth_url: <string> ]

# Name of the property to get "login" from user infos API (if not in the default list ["login", "username"] )
# The login is mandatory to store in the database the name of the user.
[ custom_login_property: <string>]
```

#### Authorization config

```yaml
# Time interval that check if the RBAC cache need to be refreshed with db content. Only for SQL database setup.
[ check_latest_update_interval: <duration> | default = 30s ]

# Default permissions for guest users (logged-in users)
guest_permissions:
  - [ <Permissions> ]
```

##### Permissions

```yaml
# Actions authorized by the permission
actions:
  - <enum= "read" | "create" | "update" | "delete" | "*">
# Resource kinds that are concerned by the permission
scopes:
  - <enum= kind | "*">
```

### Database config

```yaml
# Config in case you want to use a file DB.
# Prefer the SQL config in case you are running multiple Perses instances.
[ file: <Database file config> ]

# The SQL config
[ sql: <Database SQL config> ]
```

#### Database_file config

```yaml
# The path to the folder containing the database
folder: <path>

# The file extension and so the file format used when storing and reading data from/to the database
[ extension: <string> | default = yaml ]

# Whether the database is case-sensitive.
# Be aware that to reflect this config, metadata.project and metadata.name from the resources managed can be modified before the insertion in the database.
[ case_sensitive: <string> | default = false ]
```

#### Database SQL config

```yaml
# TLS configuration.
[ tls_config: <TLS config> ]

# Username used for the connection
[ user: <secret> ]

# The password associated to the user. Mandatory if the user is set
[ password: <secret> ]

# The path to a file containing a password
[ password_file: <filename> ]

# Network type. For example "tcp"
[ net: <string> ]

# The network address. If set then `net` is mandatory. Example: "localhost:3306"
[ addr: <secret> ]

# Database name
[ db_name: <string> ]
[ collation: <string> ]

# Max packet size allowed
[ max_allowed_packet: <int> ]

# Server public key name
[ server_pub_key: <string> ]

# Dial timeout
[ timeout: <duration> ]

# I/O read timeout
[ read_timeout: <duration> ]

# I/O write timeout
[ write_timeout: <duration> ]

# Allow all files to be used with LOAD DATA LOCAL INFILE
[ allow_all_files: <boolean> | default = false ]

# Allows the cleartext client side plugin
[ allow_cleartext_passwords: <boolean> | default = false ]

# Allows fallback to unencrypted connection if server does not support TLS
[ allow_fallback_to_plaintext: <boolean> | default = false ]

# Allows the native password authentication method
[ allow_native_passwords: <boolean> | default = false ]

# Allows the old insecure password method
[ allow_old_passwords: <boolean> | default = false ]

# Check connections for liveness before using them
[ check_conn_liveness: <boolean> | default = false ]

# Return number of matching rows instead of rows changed
[ client_found_rows: <boolean> | default = false ]

# Prepend table alias to column names
[ columns_with_alias: <boolean> | default = false ]

# Interpolate placeholders into query string
[ interpolate_params: <boolean> | default = false ]

# Allow multiple statements in one query
[ multi_statements: <boolean> | default = false ]

# Parse time values to time.Time
[ parse_time: <boolean> | default = false ]

# Reject read-only connections
[ reject_read_only: <boolean> | default = false ]

# Whether the database is case-sensitive.
# Be aware that to reflect this config, metadata.project and metadata.name from the resources managed can be modified before the insertion in the database.
[ case_sensitive: <string> | default = false ]
```

### Schemas config

```yaml
# Path to the Cue schemas of the panels
[ panels_path: <path> | default = "schemas/panels" ]

# Path to the Cue schemas of the queries
[ queries_path: <path> | default = "schemas/queries" ]

# Path to the Cue schemas of the datasources
[ datasources_path: <path> | default = "schemas/datasources" ]

# Path to the Cue schemas of the variables
[ variables_path: <path> | default = "schemas/variables" ]

# The refresh interval of the cue schemas regardless their paths
[ interval: <duration> | default = 1h ]
```

### TLS config

A TLS config allows configuring TLS connections.

```yaml
# CA certificate to validate API server certificate with. At most one of ca and ca_file is allowed.
[ ca: <string> ]
[ ca_file: <filename> ]

# Certificate and key for client cert authentication to the server.
# At most one of cert and cert_file is allowed.
# At most one of key and key_file is allowed.
[ cert: <string> ]
[ cert_file: <filename> ]
[ key: <secret> ]
[ key_file: <filename> ]

# ServerName extension to indicate the name of the server.
# https://tools.ietf.org/html/rfc4366#section-3.1
[ server_name: <string> ]

# Disable validation of the server certificate.
[ insecure_skip_verify: <boolean> ]

# Minimum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS
# 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
# If unset, Prometheus will use Go default minimum version, which is TLS 1.2.
# See MinVersion in https://pkg.go.dev/crypto/tls#Config.
[ min_version: <string> ]
# Maximum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS
# 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
# If unset, Prometheus will use Go default maximum version, which is TLS 1.3.
# See MaxVersion in https://pkg.go.dev/crypto/tls#Config.
[ max_version: <string> ]
```

### Provisioning config

```yaml
[ interval: <duration> | default = 1h ]

# List of folder that Perses will read periodically. 
# Every known data found in the different folders will be injected in the database regardless what exist.
folders:
  - <string>
```

### GlobalDatasourceDiscovery config

```yaml
# The name of the discovery config. It is used for logging purposes only
discovery_name: <string>

# Refresh interval to run the discovery
[ refresh_interval: <duration> | default = 5m ]

# HTTP-based service discovery provides a more generic way to generate a set of global datasource and serves as an interface to plug in custom service discovery mechanisms.
# It fetches an HTTP endpoint containing a list of zero or more global datasources.
# The target must reply with an HTTP 200 response.
# The HTTP header Content-Type must be application/json, and the body must be valid array of JSON.
[ http_sd: <HTTPSD Config> ]

# Kubernetes SD configurations allow retrieving global datasource from Kubernetes' REST API
# and always staying synchronized with the cluster state.
[ kubernetes_sd: <KubernetesSD Config> ]
```

#### HTTPSD Config

```yaml
# URL of the HTTP server exposing the global datasource list to retrieve.
url: <url>

[ auth: <Auth specification> ]

# The HTTP authorization credentials for the targets.
# Basic Auth and authorization are mutually exclusive. Use one or the other not both at the same time.
[ authorization: <Authorization specification> ]

# Config used to connect to the targets.
[ tls_config: <TLS Config specification> ]

headers:
  [<string>:<string>]
```

##### Auth

```yaml
[ basic_auth: <Basic Auth specification> ]

[ oauth_config: <Oauth specification> ]
```

##### Oauth specification

```yaml
# ClientID is the application's ID.
client_id: <string>

# ClientSecret is the application's secret.
client_secret: <string>

# TokenURL is the resource server's token endpoint URL. This is a constant specific to each server.
token_url: <string>
```

##### Basic Auth specification

See the [BasicAuth](../api/secret.md#basic-auth-specification) specification.

##### Authorization specification

See the [Authorization](../api/secret.md#authorization-specification) specification.

##### TLS Config specification

See the [TLS Config](../api/secret.md#tls-config-specification) specification.

#### KubernetesSD Config

```yaml
# The name of the datasource plugin that should be filled when creating datasources found.
datasource_plugin_kind: <string>

# Kubernetes namespace to constraint the query to only one namespace.
# Leave empty if you are looking for datasource cross-namespace.
[ namespace: <string> ]

# Configuration when you want to discover the services in Kubernetes
[ service_configuration: <KubeServiceDiscovery Config> ]

# Configuration when you want to discover the pods in Kubernetes
[ pod_configuration: <KubePodDiscovery Config> ]

# The labels used to filter the list of resource when contacting the Kubernetes API.
labels:
 [<string>:<string>]
```

##### KubeServiceDiscovery Config

```yaml
# If set to true, Perses server will discovery the service
[ enable: <boolean> | default = false ]

# Name of the service port for the target.
[ port_name: <string> ]

# Number of the service port for the target.
[ port_number: <int32> ]

# The type of the service.
[ service_type: < enum | possibleValue = 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName' > ]
```

##### KubePodDiscovery Config

```yaml
# If set to true, Perses server will discover the pods
[ enable: <boolean> | default = false ]

# Name of the container the target address points to.
[ container_name: <string> ]
  
# Name of the container port.
[ container_port_name: <string> ]
  
# Number of the container port.
[ container_port_number: <string> ]
```

### EphemeralDashboard config

```yaml
# When true user will be able to use the ephemeral dashboard at project level
[ enable: <bool> | default = false ]

# The interval at which to trigger the cleanup of ephemeral dashboards, based on their TTLs.
[ cleanup_interval: <duration> | default = 1d ]
```

### Frontend config

```yaml
# When it is true, Perses won't serve the frontend anymore.
[ disable: <bool> | default = false ]

# A list of dashboards you would like to display in the UI home page
important_dashboards:
  - [ <Dashboard Selector config> ]

# The markdown content to be displayed on the UI home page
[ information: <string> ]

# TimeRange configuration
[ time_range: <TimeRange config> ]
```

#### TimeRange config

```yaml
# The different relative timerange options available in dashboards and explorer
# Use duration format. The display will be computed automatically. Eg: "5m: will be display "Last 5 minutes"
[ options: <duration[]> | default = [ "5m", "15m", "30m", "1h", "6h", "12h", "1d", "1w", "2w" ] ]
# Allow you to disable the custom time range (absolute time range)
[ disable_custom:  <bool> | default = false ]
```

#### Dashboard Selector config

```yaml
# The project name (dashboard.metadata.project)
project: <string>

# The dashboard name (dashboard.metadata.name)
dashboard: <string>
```
