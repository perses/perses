# Configuration

Perses is configured via command-line flags and a configuration file

## Flags available

```bash
  -config string
        Path to the yaml configuration file for the api. Configuration can be overridden when using the environment variable
  -log.level string
        log level. Possible value: panic, fatal, error, warning, info, debug, trace (default "info")
  -log.method-trace
        Include the calling method as a field in the log. Can be useful to see immediately where the log comes from
  -pprof
        Enable pprof
  -web.hide-port
        If true, it won t be print on stdout the port listened to receive the HTTP request
  -web.listen-address string
        The address to listen on for HTTP requests, web interface and telemetry. (default ":8080")
  -web.telemetry-path string
        Path under which to expose metrics. (default "/metrics")
  -web.tls-cert-file string
    	The path to the cert to use for the HTTPS server
  -web.tls-key-file string
    	The path to the key to use for the HTTPS server
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

Note: to have the corresponding environment variable, you have to append all previous keys in the YAML and put it in
uppercase. Every environment variable for this config are prefixed by `PERSES`

For example, the environment variable corresponding to the file extension of the file DB would be:

```bash
PERSES_DATABASE_FILE_EXTENSION=yaml
```

When you have a list of objects, you can use the index to specify the object you want to configure.
For example, to configure the first provisioning folder, the environment variable would be:

```bash
PERSES_PROVISIONING_FOLDERS_0="/path/to/the/folder"
```

Another example, to configure the name of the globaldatasource discovery, the environment variable would be:

```bash
PERSES_GLOBAL_DATASOURCE_DISCOVERY_0_DISCOVERY_NAME="my-discovery"
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
api_prefix: <string> # Optional
  
# It contains any configuration that changes the API behavior like the endpoints exposed or if the permissions are activated.
security: <Security config> # Optional

# Database configuration 
database: <Database config> # Optional

# Dashboard configuration
dashboard: <Dashboard config> # Optional

# The configuration to access the CUE schemas
# This config is deprecated. It will be removed in the future. Please remove it from your config. 
schemas: <Schemas config> # Optional

# If provided, Perses server will look to the different folders configured and populate the database based on what it is found
# Be careful: the data coming from the provisioning folder will totally override what exists in the database.
provisioning: <Provisioning config> # Optional

# This configuration allows to fine tune the datasource feature. (To disable, or for discovery)
datasource: <Datasource config> # Optional

# This configuration allows to fine tune the variable feature
variable: <Variable config> # Optional

# The interval at which to trigger the cleanup of ephemeral dashboards, based on their TTLs.
# This config is deprecated. Please use the config ephemeral_dashboard instead.
ephemeral_dashboards_cleanup_interval: <duration> # Optional

# The config for the ephemeral dashboard feature. This is the way to activate the feature.
ephemeral_dashboard: < EphemeralDashboard config > # Optional

# Any configuration related to the UI itself
frontend: <Frontend config> # Optional

# The configuration to access and load the runtime plugins 
plugin: <Plugin config> # Optional
```

### Security config

```yaml
# A flag that will disable any HTTP POST, PUT and DELETE endpoint in the API.
# It will also change the UI to reflect this config, by removing any action button and will prevent the access to a form.
readonly: <boolean> | default = false # Optional
  
# Cookie configuration
cookie: <Cookie config> # Optional
  
# It contains the config regarding the time to live of the refresh/access token.
authentication: <Authentication config> # Optional

# It contains any configuration that changes authorization behavior like default permissions
authorization: <Authorization config> # Optional

# When it is true, the authentication and authorization config are considered.
# And you will need a valid JWT token to contact most of the endpoints exposed by the API
enable_auth: <boolean> | default = false # Optional

# The secret key used to encrypt and decrypt sensitive data stored in the database such as the password of the basic auth for a datasource.
# Note that if it is not provided, it will use a default value.
# On a production instance, you should set this key.
# Also note the key size must be exactly 32 bytes long as we are using AES-256 to encrypt the data.
encryption_key: <secret> # Optional

# The path to the file containing the secret key.
encryption_key_file: <filename> # Optional

# Configuration for CORS (cross-origin resource sharing).
cors: <CORS config> # Optional
```

#### Cookie config

```yaml
# Set the same_site cookie attribute and prevents the browser from sending the cookie along with cross-site requests.
# The main goal is to mitigate the risk of cross-origin information leakage.
# This setting also provides some protection against cross-site request forgery attacks (CSRF)
same_site: < enum | possibleValue = 'strict' | 'lax' | 'none' > | default = lax # Optional

# Set to true if you host Perses behind HTTPS. Default is false
secure: <boolean> | default = false # Optional
```

#### Authentication config

```yaml
# It is the time to live of the access token. By default, it is 15 minutes.
access_token_ttl: <duration> | default = 15min # Optional

# It is the time to live of the refresh token. The refresh token is used to get a new access token when it is expired.
# By default, it is 24 hours.
refresh_token_ttl: <duration> | default = 24h # Optional

# With this attribute, you can deactivate the Sign-up page which induces the deactivation of the endpoint that gives the possibility to create a user.
disable_sign_up: <boolean> | default = false # Optional

# Authentication providers
providers: <Authentication providers> # Optional
```

##### Authentication providers

Check the [helpers](./oauth-configuration-helpers.md) to help you to configure the different providers.

```yaml
# Enable the native authentication providers
enable_native: <boolean> | default = false # Optional

# List of the OIDC authentication providers
oidc:
  - <OIDC provider> # Optional
# List of the OIDC authentication providers
oauth:
  - <OAuth provider> # Optional
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
  client_id: <secret> # Optional
  # Allow to use a different Client Secret for the device code flow
  client_secret: <secret> # Optional
  # Allow using different Scopes for the device code flow
  scopes:
  - <string> # Optional

client_credentials:
  # Allow using a different Client ID for the client credentials flow
  client_id: <secret> # Optional
  # Allow using a different Client Secret for the client credentials flow
  client_secret: <secret> # Optional
  # Allow using different Scopes for the client credentials flow
  scopes:
  - <string> # Optional

# The callback URL for authorization code (Have to be <your URL> + /api/auth/providers/oidc/{slug}/callback)
# If not set it will get it from the request.
redirect_uri: <string> # Optional

# The needed scopes to authenticate a user in the provider. It's not mandatory because it will depend on the provider
scopes:
  - <string> # Optional

# Some configuration of the HTTP client used to make the requests to the provider
http: <Authentication provider HTTP Config>

# The provider issuer URL
issuer: <string>

# A custom discovery URL if different from {issuer}/.well-known/openid-configuration
discovery_url: <string> # Optional

# Disable PKCE verification
disable_pkce: <boolean> | default = false # Optional

# The additional url params that will be appended to /authorize provider's endpoint
url_params:
  <string>: <string> # Optional
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
  client_id: <secret> # Optional
  # Allow using a different Client Secret for the device code flow
  client_secret: <secret> # Optional
  # Allow using different Scopes for the device code flow
  scopes:
    - <string> # Optional

client_credentials:
  # Allow using a different Client ID for the client credentials flow
  client_id: <secret> # Optional
  # Allow using a different Client Secret for the client credentials flow
  client_secret: <secret> # Optional
  # Allow using different Scopes for the client credentials flow
  scopes:
    - <string> # Optional

# The callback URL for authorization code (Have to be <your URL> + /api/auth/providers/oauth/{slug}/callback)
# If not set it will get it from the request.
redirect_uri: <string> # Optional

# The needed scopes to authenticate a user in the provider
scopes:
  - <string> # Optional

# Some configuration of the HTTP client used to make the requests to the provider
http: <Authentication provider HTTP Config>

# The provider Authorization URL
auth_url: <string>

# The provider Token URL
token_url: <string>

# The provider User Infos URL
user_infos_url: <string>

# The provider Device Auth URL
# If we want to use the device code flow, we need to provide this URL, otherwise an error will fire saying
# it's not supported.
device_auth_url: <string> # Optional

# Name of the property to get "login" from user infos API (if not in the default list ["login", "username"] )
# The login is mandatory to store in the database the name of the user.
custom_login_property: <string> # Optional
```

###### Authentication provider HTTP Config

```yaml
# Request timeout
timeout: <duration> | default = 1m # Optional

# TLS configuration.
tls_config: <TLS config> # Optional
```

#### Authorization config

```yaml
# Time interval that check if the RBAC cache need to be refreshed with db content. Only for SQL database setup.
check_latest_update_interval: <duration> | default = 30s> # Optional

# Default permissions for guest users (logged-in users)
guest_permissions:
  - <Permissions> # Optional
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

#### CORS config

```yaml
# Enable CORS middleware.
# See also: https://fetch.spec.whatwg.org/#cors-protocol
enable: <boolean> | default = false # Optional

# Configure the value of the Access-Control-Allow-Origin response header.
# The wildcard characters '*' (0+ chars) and '?' (1 char) are supported.
# See also: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
allow_origins: <string[]> | default = ["*"] # Optional

# Configure the value of the Access-Control-Allow-Methods response header.
# If left empty, the header will be filled from the `Allow` header specified
# in the request.
# See also: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
allow_methods: <string[]> | default = [] # Optional

# Configure the value of the Access-Control-Allow-Headers response header. 
# See also: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
allow_headers: <string[]> | default = [] # Optional

# Configure the value of the Access-Control-Allow-Credentials response header.
# See also: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
allow_credentials: <boolean> | default = false # Optional

# Configure the value of Access-Control-Expose-Headers response header.
# See also: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Header
expose_headers: <string[]> | default = [] # Optional

# Configure how long (in seconds) the results of a preflight request can be cached.
max_age: <intger> | default = 0 # Optional
```

### Database config

```yaml
# Config in case you want to use a file DB.
# Prefer the SQL config in case you are running multiple Perses instances.
file: <Database file config> # Optional

# The SQL config
sql: <Database SQL config> # Optional
```

#### Database_file config

```yaml
# The path to the folder containing the database
folder: <path>

# The file extension and so the file format used when storing and reading data from/to the database
extension: <string> | default = yaml # Optional

# Whether the database is case-sensitive.
# Be aware that to reflect this config, metadata.project and metadata.name from the resources managed can be modified before the insertion in the database.
case_sensitive: <string> | default = false # Optional
```

#### Database SQL config

```yaml
# TLS configuration.
tls_config: <TLS config> # Optional

# Username used for the connection
user: <secret> # Optional

# The password associated to the user. Mandatory if the user is set
password: <secret> # Optional

# The path to a file containing a password
password_file: <filename> # Optional

# Network type. For example "tcp"
net: <string> # Optional

# The network address. If set then `net` is mandatory. Example: "localhost:3306"
addr: <secret> # Optional

# Database name
db_name: <string> # Optional
collation: <string> # Optional

# Max packet size allowed
max_allowed_packet: <int> # Optional

# Server public key name
server_pub_key: <string> # Optional

# Dial timeout
timeout: <duration> # Optional

# I/O read timeout
read_timeout: <duration> # Optional

# I/O write timeout
write_timeout: <duration> # Optional

# Allow all files to be used with LOAD DATA LOCAL INFILE
allow_all_files: <boolean> | default = false # Optional

# Allows the cleartext client side plugin
allow_cleartext_passwords: <boolean> | default = false # Optional

# Allows fallback to unencrypted connection if server does not support TLS
allow_fallback_to_plaintext: <boolean> | default = false # Optional

# Allows the native password authentication method
allow_native_passwords: <boolean> | default = false # Optional

# Allows the old insecure password method
allow_old_passwords: <boolean> | default = false # Optional

# Check connections for liveness before using them
check_conn_liveness: <boolean> | default = false # Optional

# Return number of matching rows instead of rows changed
client_found_rows: <boolean> | default = false # Optional

# Prepend table alias to column names
columns_with_alias: <boolean> | default = false # Optional

# Interpolate placeholders into query string
interpolate_params: <boolean> | default = false # Optional

# Allow multiple statements in one query
multi_statements: <boolean> | default = false # Optional

# Parse time values to time.Time
parse_time: <boolean> | default = false # Optional

# Reject read-only connections
reject_read_only: <boolean> | default = false # Optional

# Whether the database is case-sensitive.
# Be aware that to reflect this config, metadata.project and metadata.name from the resources managed can be modified before the insertion in the database.
case_sensitive: <string> | default = false # Optional
```

### Schemas config

```yaml
# Path to the Cue schemas of the panels
panels_path: <path> | default = "schemas/panels" # Optional

# Path to the Cue schemas of the queries
queries_path: <path> | default = "schemas/queries" # Optional

# Path to the Cue schemas of the datasources
datasources_path: <path> | default = "schemas/datasources" # Optional

# Path to the Cue schemas of the variables
variables_path: <path> | default = "schemas/variables" # Optional

# The refresh interval of the cue schemas regardless their paths
interval: <duration> | default = 1h # Optional
```

### TLS config

A TLS config allows configuring TLS connections.

```yaml
# CA certificate to validate API server certificate with. At most one of ca and ca_file is allowed.
ca: <string> # Optional
ca_file: <filename> # Optional

# Certificate and key for client cert authentication to the server.
# At most one of cert and cert_file is allowed.
# At most one of key and key_file is allowed.
cert: <string> # Optional
cert_file: <filename> # Optional
key: <secret> # Optional
key_file: <filename> # Optional

# ServerName extension to indicate the name of the server.
# https://tools.ietf.org/html/rfc4366#section-3.1
server_name: <string> # Optional

# Disable validation of the server certificate.
insecure_skip_verify: <boolean> # Optional

# Minimum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS
# 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
# If unset, Perses will use Go default minimum version, which is TLS 1.2.
# See MinVersion in https://pkg.go.dev/crypto/tls#Config.
min_version: <string> # Optional
# Maximum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS
# 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
# If unset, Perses will use Go default maximum version, which is TLS 1.3.
# See MaxVersion in https://pkg.go.dev/crypto/tls#Config.
max_version: <string> # Optional
```

### Provisioning config

```yaml
interval: <duration> | default = 1h # Optional

# List of folder that Perses will read periodically. 
# Every known data found in the different folders will be injected in the database regardless what exist.
folders:
  - <string>
```

### Variable config

```yaml
global:
  # It is used to disable the global variable feature.
  # Note that if the global datasource is disabled, the global variable will also be disabled.
  disable: <boolean> | default = false # Optional

project:
  # It is used to disable the project variable feature.
  # Note that if the global datasource and the project datasource are disabled,
  # then the project variable will also be disabled.
  disable: <boolean> | default = false # Optional

# When used is preventing the possibility to add a variable directly in the dashboard spec.
disable_local: <boolean> | default = false # Optional
```

### Datasource config

```yaml
global:
  # It is used to disable the global datasource feature.
  # It will also remove the associated proxy.
  # Also, since the global variable depends on the global datasource, it will also disable the global variable feature.
  disable: <boolean> | default = false # Optional
  discovery: <GlobalDatasourceDiscovery config> # Optional

project:
  # It is used to disable the project datasource feature.
  # It will also remove the associated proxy.
  disable: <boolean> | default = false # Optional

# When used is preventing the possibility to add a datasource directly in the dashboard spec.
# It will also disable the associated proxy.
disable_local: <boolean> | default = false # Optional
```

#### GlobalDatasourceDiscovery config

```yaml
# The name of the discovery config. It is used for logging purposes only
name: <string>

# Refresh interval to run the discovery
refresh_interval: <duration> | default = 5m # Optional

# HTTP-based service discovery provides a more generic way to generate a set of global datasource and serves as an interface to plug in custom service discovery mechanisms.
# It fetches an HTTP endpoint containing a list of zero or more global datasources.
# The target must reply with an HTTP 200 response.
# The HTTP header Content-Type must be application/json, and the body must be valid array of JSON.
http_sd: <HTTPSD Config> # Optional

# Kubernetes SD configurations allow retrieving global datasource from Kubernetes' REST API
# and always staying synchronized with the cluster state.
kubernetes_sd: <KubernetesSD Config> # Optional
```

##### HTTPSD Config

```yaml
# URL of the HTTP server exposing the global datasource list to retrieve.
url: <url>
# The HTTP authorization credentials for the targets.
# Basic Auth, authorization and oauth are mutually exclusive. Use one of them.
basic_auth: <Basic Auth specification> # Optional
oauth: <Oauth specification> # Optional
authorization: <Authorization specification> # Optional

# Config used to connect to the targets.
tls_config: <TLS Config specification> # Optional

headers:
  <string>: <string> # Optional
```

###### Oauth specification

```yaml
# ClientID is the application's ID.
client_id: <string>

# ClientSecret is the application's secret.
client_secret: <string>

# TokenURL is the resource server's token endpoint URL. This is a constant specific to each server.
token_url: <string>
```

###### Basic Auth specification

See the [BasicAuth](../api/secret.md#basic-auth-specification) specification.

###### Authorization specification

See the [Authorization](../api/secret.md#authorization-specification) specification.

###### TLS Config specification

See the [TLS Config](../api/secret.md#tls-config-specification) specification.

##### KubernetesSD Config

```yaml
# The name of the datasource plugin that should be filled when creating datasources found.
datasource_plugin_kind: <string>

# Kubernetes namespace to constraint the query to only one namespace.
# Leave empty if you are looking for datasource cross-namespace.
namespace: <string> # Optional

# Configuration when you want to discover the services in Kubernetes
service_configuration: <KubeServiceDiscovery Config> # Optional

# Configuration when you want to discover the pods in Kubernetes
pod_configuration: <KubePodDiscovery Config> # Optional

# The labels used to filter the list of resource when contacting the Kubernetes API.
labels:
  <string>: <string> # Optional
```

##### KubeServiceDiscovery Config

```yaml
# If set to true, Perses server will discovery the service
enable: <boolean> | default = false # Optional

# Name of the service port for the target.
port_name: <string> # Optional

# Number of the service port for the target.
port_number: <int32> # Optional

# The type of the service.
service_type: < enum | possibleValue = 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName' > # Optional
```

##### KubePodDiscovery Config

```yaml
# If set to true, Perses server will discover the pods
enable: <boolean> | default = false # Optional

# Name of the container the target address points to.
container_name: <string> # Optional
  
# Name of the container port.
container_port_name: <string> # Optional
  
# Number of the container port.
container_port_number: <string> # Optional
```

### EphemeralDashboard config

```yaml
# When true user will be able to use the ephemeral dashboard at project level
enable: <bool> | default = false # Optional

# The interval at which to trigger the cleanup of ephemeral dashboards, based on their TTLs.
cleanup_interval: <duration> | default = 1d # Optional
```

### Frontend config

```yaml
# When it is true, Perses won't serve the frontend anymore.
disable: <bool> | default = false # Optional

# A list of dashboards you would like to display in the UI home page
important_dashboards:
  - <Dashboard Selector config> # Optional

# The markdown content to be displayed on the UI home page
information: <string> # Optional

# TimeRange configuration
time_range: <TimeRange config> # Optional
```

#### TimeRange config

```yaml
# The different relative timerange options available in dashboards and explorer
# Use duration format. The display will be computed automatically. Eg: "5m: will be display "Last 5 minutes"
options: <duration[]> | default = [ "5m", "15m", "30m", "1h", "6h", "12h", "1d", "1w", "2w" ] # Optional
# Allow you to disable the custom time range (absolute time range)
disable_custom:  <bool> | default = false # Optional
# Allow you to disable the zoom actions (extend or half current time range)
disable_zoom:  <bool> | default = false # Optional
```

#### Dashboard Selector config

```yaml
# The project name (dashboard.metadata.project)
project: <string>

# The dashboard name (dashboard.metadata.name)
dashboard: <string>
```

### Plugin config

```yaml
# The path to the folder containing the plugins
# The default value depends if Perses is running in a container or not.
folder: <path> | default = ("plugins" | "/etc/perses/plugins") # Optional

# The path to the folder containing the plugins archive. 
# When Perses is starting, it will extract the content of the archive in the folder specified in the `folder` attribute.
archive_path: <path> | default = ("plugins-archive" | "/etc/perses/plugins-archive") # Optional

dev_environment: <PluginDevEnvironment config> # Optional
```

#### PluginDevEnvironment config

```yaml
# The URL of the development server hosting the plugin. 
# It is usually created by the command `rsbuild dev`.
url: <string> | default = http://localhost:3005 # Optional

plugins: 
  - <PluginInDevelopment config>
```

##### PluginInDevelopment config

```yaml
# The name of the plugin in development
name: <string>

# A way to disable the schema validation of the plugin in development.
# It can be useful when you are developing a plugin, and you didn't define the schema yet.
disable_schema: <bool> | default = false # Optional

# The unique URL of the development server hosting this specific plugin.
# If defined, it will override the URL defined in the `PluginDevEnvironment` config.
url: <string> # Optional

# The absolute path to the plugin in development.
absolute_path: <string>
```


### Dashboard config

```yaml
custom_lint_rules:
  - <CustomLintRule config> # Optional
```

#### CustomLintRule config

Refer to the associated [documentation](./custom-lint-rules.md) for more details.

```yaml
# The name of the custom lint rulea
name: <string>

# The target of the custom lint rule. It is a JSONPath expression.
target: <string>

# The assertion of the custom lint rule. It is a valid CEL expression. 
# The value is the result of the target. The result of the assertion must be a boolean.
assertion: <string>

# The message to display when the assertion is false. 
message: <string>

# If set to true, the custom lint rule is disabled.
disable: <bool> | default = false # Optional
```
