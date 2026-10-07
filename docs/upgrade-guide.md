# Perses Upgrade Guide

This document provides instructions for upgrading Perses specially when dealing with breaking changes. As Perses is a
rapidly evolving project, it's important to keep your installation up to date to benefit from the latest features and
improvements.

Then, upgrading Perses is also depending on your usage as Perses can be used in different ways (e.g. as a standalone
application, as a library, etc.). Therefore, the upgrade process may vary based on your specific use case.

## Perses application

### Upgrading from v0.54.0 to v0.55.0

#### Important dashboards are now grouped

`frontend.important_dashboards` is now a list of groups, each with an optional `title` and `description`, and a list
of dashboard selectors. A selector without `dashboard` marks every dashboard of the project as important.

The previous flat list of selectors is deprecated and will be removed in v0.57.0. It is still accepted (and converted
into a single untitled group), but a deprecation warning is logged at startup. Mixing both formats is rejected.

```yaml
# Before
frontend:
  important_dashboards:
    - project: "perses"
      dashboard: "Demo"

# After
frontend:
  important_dashboards:
    - title: "Quick links" # Optional
      dashboards:
        - project: "perses"
          dashboard: "Demo"
```

If you set important dashboards through environment variables, the legacy shape is not supported there: Perses will
fail to start until the variables are updated accordingly:

```txt
PERSES_FRONTEND_IMPORTANT_DASHBOARDS_0_PROJECT   -> PERSES_FRONTEND_IMPORTANT_DASHBOARDS_0_DASHBOARDS_0_PROJECT
PERSES_FRONTEND_IMPORTANT_DASHBOARDS_0_DASHBOARD -> PERSES_FRONTEND_IMPORTANT_DASHBOARDS_0_DASHBOARDS_0_DASHBOARD
```

#### The datasource proxy restricts the destinations it can reach

To prevent the datasource proxy from being used to reach services that are not datasources (Server-Side Request
Forgery), the destinations of the proxy are now verified. By default, the proxy refuses to reach:

- the loopback interface (`127.0.0.0/8`, `::1`, `localhost`)
- the link-local addresses (`169.254.0.0/16`, `fe80::/10`) and the known cloud metadata / credentials endpoints
- the multicast, reserved and unspecified addresses
- the Kubernetes API service when Perses is running in a Kubernetes cluster
- any URL scheme other than `http` and `https`, the URLs containing credentials (`http://user:password@host`), and the
  Unix sockets for the SQL datasources
- the IPv4 addresses not written in the dotted-decimal notation (e.g. `2130706433`, `0x7f000001` or `127.1`)

The private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, ...) remain allowed by default.

**If one of your datasources is running on the same host as Perses** (e.g. `http://localhost:9090`), the requests to
this datasource are now refused with a `403 Forbidden` error, and saving such a datasource is refused with a
`400 Bad Request` error. You have to explicitly allow the loopback interface:

```yaml
datasource:
  proxy:
    allowed_networks:
      - "127.0.0.0/8"
      - "::1/128"
```

The same applies to the OAuth token URL of the secrets used by the datasources. Saving a secret whose OAuth token URL
is not allowed is refused with a `400 Bad Request` error, and the requests to a datasource using such a secret are
refused with a `403 Forbidden` error. If you restrict the destinations with `allowed_hosts`, this list must also contain
the host of the OAuth token URL.

When an IP address is part of both an allowed and a denied network, the most specific network wins (on equal prefix
lengths, the allowed network wins). Allowing a large network therefore doesn't allow a more specific denied network,
which has to be allowed explicitly. For example:

- allowing `127.0.0.0/8` allows the loopback interface;
- allowing `10.0.0.0/8` (e.g. with `deny_private_networks: true`) doesn't allow the Kubernetes API service IP;
- allowing `169.254.0.0/16` doesn't allow the cloud metadata endpoint `169.254.169.254`.

If Perses is using an HTTP proxy configured through the environment (`HTTP_PROXY`, `HTTPS_PROXY`), a datasource can no
longer target the address of this proxy, neither directly (for example when the proxy is bypassed with `NO_PROXY`) nor
through the proxy itself.

You can also further restrict the destinations, for example to deny the private networks or to only allow a list of
hosts. See the [DatasourceProxy config](./configuration/configuration.md#datasourceproxy-config) for more details.

Note for the users of `v0.55.0-beta.4`: the configuration of the HTTP proxy introduced in this beta (`datasource.http_proxy`)
has moved to `datasource.proxy.http`, so the whole configuration of the datasource proxy lives in a single section.

```yaml
# Before (v0.55.0-beta.4)
datasource:
  http_proxy:
    max_timeout: 30s

# After
datasource:
  proxy:
    http:
      max_timeout: 30s
```

#### The datasource proxy no longer forwards the credentials used to authenticate against Perses

Before forwarding a request to a datasource, the proxy now removes the credentials that the client used to authenticate
against Perses:

- The `Cookie` header sent by the client is always removed, because it contains the Perses session (and possibly the
  tokens of the OIDC/OAuth provider). You can't forward it with `allowHeaders`. A `Cookie` header explicitly defined in the
  datasource configuration is still sent.
- When the Perses native authorization is enabled, the `Authorization` header sent by the client (which contains the
  Perses token) is always removed. You can't forward it with `allowHeaders`. Use a Secret or the `oauthPassthrough`
  option to authenticate against the datasource.
- When the authorization is delegated (i.e. Kubernetes), the `Authorization` header sent by the client is still
  forwarded to the datasource. To prevent this, add `Authorization` to `dropHeaders`.
- An `Authorization` header defined in the `headers` of the datasource configuration is now **always ignored**,
  whatever its case (e.g. `authorization`). If you were using it to authenticate against the datasource, move the
  credentials to a Secret (`authorization`, `basicAuth` or `oauth`) and reference it in the datasource configuration:

```yaml
# Before
kind: Datasource
spec:
  plugin:
    kind: PrometheusDatasource
    spec:
      proxy:
        kind: HTTPProxy
        spec:
          url: https://prometheus.example.com
          headers:
            Authorization: "Bearer <token>"

# After
kind: Secret
metadata:
  name: prometheus-token
  project: my-project
spec:
  authorization:
    type: Bearer
    credentials: "<token>"
---
kind: Datasource
spec:
  plugin:
    kind: PrometheusDatasource
    spec:
      proxy:
        kind: HTTPProxy
        spec:
          url: https://prometheus.example.com
          secret: prometheus-token
```

The responses returned by the datasources through the proxy are also hardened, as they are served under the Perses
origin:

- they get the headers `Content-Security-Policy: sandbox; default-src 'none'; frame-ancestors 'none'` and
  `X-Content-Type-Options: nosniff`;
- the headers that would apply to the Perses origin are removed: `Set-Cookie`, `Set-Cookie2`, `Clear-Site-Data`,
  `Refresh`, `Strict-Transport-Security`, `Alt-Svc`, `Service-Worker-Allowed` and the CORS headers (the CORS policy is
  defined by `security.cors`);
- only the relative `Location` / `Content-Location` headers are kept.

Finally, the SQL proxy now rejects the queries using `INTO OUTFILE` or `INTO DUMPFILE` (MySQL / MariaDB).

See the [proxy documentation](./concepts/proxy.md) for more details.

#### Files referenced in secrets must be in an allowed directory

The Secrets and GlobalSecrets can reference files from the Perses server (`basicAuth.passwordFile`,
`authorization.credentialsFile`, `oauth.clientSecretFile`, `tlsConfig.caFile`, `tlsConfig.certFile`,
`tlsConfig.keyFile`). This could be used by anyone able to create a secret to read arbitrary files through the
datasource proxy.

These file references are now **rejected by default**. If you rely on them, you must list the directories where the
files are located with the new setting `security.secret_file_allowed_directories`:

```yaml
security:
  secret_file_allowed_directories:
    - /etc/perses/secrets
```

Each directory must be an absolute path, and the root directory (`/`) is not accepted. The file paths used in the
secrets must also be absolute. Symlinks are resolved, and the resolved file must remain inside one of the allowed
directories. The verification is done when saving a secret and before the proxy uses it. Saving a secret referencing a
file that is not allowed is refused, and the requests to a datasource using such a secret fail.

#### `encryption_key` is mandatory when the authentication is enabled

When the authentication is enabled (`security.enable_auth: true`), the encryption key is also used to encrypt the access
and refresh tokens. Perses was previously falling back on a default (and publicly known) key when none was provided.

Now, if the authentication is enabled and neither `security.encryption_key` nor `security.encryption_key_file` is set,
**Perses refuses to start**. The key must be exactly 32 bytes long. You can generate one with one of these commands:

```bash
LC_ALL=C tr -dc '[:graph:]' < /dev/urandom | head -c 32
openssl rand -base64 24 | head -c 32
```

```yaml
security:
  enable_auth: true
  encryption_key: "<32 bytes long secret>"
  # or
  encryption_key_file: /etc/perses/encryption_key
```

Note that if you were already running Perses with the auth enabled and without any encryption key, setting a new key
means the data previously encrypted with the default key (e.g. the secrets stored in the database) can no longer be
decrypted. You will have to re-create these secrets after the upgrade, and users will need to log in again.

### Upgrading from v0.53.0 to v0.54.0

#### SQL Database default configuration changes

We have changed the behavior of the SQL database config regarding the default value of few fields. It has been done to follow the default behavior of the driver: https://github.com/go-sql-driver/mysql/blob/master/dsn.go#L97

If you do not use the SQL config, then this does not concern you. If you use the SQL config, here the fields that the default value have been changed:

```yaml
database:
  sql:
    allow_native_passwords: true # previously false
    check_conn_liveness: true    # previously false
```

We also have added more field to the configuration to give you more facilities to customize the database connection:

```yaml
database:
  sql:
    # Maximum amount of time a connection may be reused. Keep it shorter than the server's wait_timeout
    # to avoid reusing connections the server has already closed.
    conn_max_lifetime: <duration> | default = 3m # Optional

    # Maximum amount of time a connection may be idle before it is closed.
    conn_max_idle_time: <duration> | default = 1m # Optional

    # Maximum number of open connections to the database. A value <= 0 means unlimited.
    max_open_conns: <int> # Optional

    # Maximum number of connections in the idle connection pool. A value <= 0 keeps the Go default (2).
    max_idle_conns: <int> # Optional
```

### Upgrading from v0.52.0 to v0.53.0

#### User change in container image

In order to simplify the build of the docker image, we have changed the default user used in the container from `nobody`
to `nonroot`. As a based image we are using now `gcr.io/distroless/static-debian12:non-root` instead of
`ggcr.io/distroless/static-debian12:latest`, which gives us a non-root user by default.

This change can impact users that is using as a database the file system inside the container, specially when running
the container with docker (not within Kubernetes). In that case, you should ensure that the `nonroot` user has the right
permissions to read and write into the database folder. If this is not the case, when upgrading the image, you will face
permission errors when Perses is trying to load the data coming from the file system.

You should not be impacted if you have overridden the user used in the container or if you are using a SQL database to
store the Perses data.²

#### TLS config changes

We are introducing a breaking change in the TLS configuration to have a consistent syntax to define TLS settings across
all data-sources specifications and across all backend sub configurations.

The previous version was mixing two syntaxes to set TLS across the various possible configuration that could lead to
confusion (camelCase and snake_case).
This breaking change is impacting only the SQL database configuration.

In the SQL configuration, if the tls_config is used, then you should change your config like that:

```txt
ca_file -> caFile
cert_file -> certFile
key_file -> keyFile
server_name -> serverName
insecure_skip_verify -> insecureSkipVerify
min_version -> minVersion
max_version -> maxVersion
```

## Plugin developer

### Upgrading from v0.54.0 to v0.55.0

#### Go SDK: `datasource.Selector` is now a union type

`datasource.Selector` has been restructured as a union type to make the distinction between a
concrete datasource reference and a variable reference explicit. The flat struct (with public `Kind`
and `Name` fields) no longer exists.

**Before:**

```go
// Concrete datasource — struct literal
sel := &datasource.Selector{Kind: "PrometheusDatasource", Name: "myPrometheus"}

// Reading fields
fmt.Println(sel.Kind, sel.Name)
```

**After:**

```go
// Concrete datasource — use the constructor
sel := datasource.NewStaticSelector("PrometheusDatasource", "myPrometheus")

// Variable reference — new in this release; name may be "foo", "$foo", or "${foo}"
sel, err := datasource.NewVariableSelector("myDatasource")

// Reading fields — check which variant is set first
if sel.Static != nil {
    fmt.Println(sel.Static.Kind, sel.Static.Name)
}
if sel.Variable != nil {
    fmt.Println(sel.Variable.Name) // bare name without "$"
}
```

If you maintain a datasource plugin with a `Selector` helper, update it to call the constructors:

```go
// Before
func Selector(datasourceName string) *datasource.Selector {
    return &datasource.Selector{
        Kind: PluginKind,
        Name: datasourceName,
    }
}

// After
func Selector(datasourceName string) *datasource.Selector {
    return datasource.NewStaticSelector(PluginKind, datasourceName)
}

func VariableSelector(datasourceName string) (*datasource.Selector, error) {
    return datasource.NewVariableSelector(datasourceName)
}
```

A static selector continues to serialize as `{"kind":"...","name":"..."}` (unchanged from previous
versions). A variable selector now serializes as the plain JSON/YAML string `"$myVar"` — this is a
new addition in this release; previously there was no way to express a variable reference in the
datasource selector wire format. Note that marshaling a zero-value `Selector` (neither `Static` nor
`Variable` set) or one with both fields set returns an error.

If you don't know in advance whether the name is a variable reference or not, use `datasource.NewSelector(kind, name)`:
it returns a variable selector when `name` starts with `$`, and a static selector otherwise.

#### Go: the old dashboard and datasource specification is removed

Since v0.54.0, the dashboard and datasource specification lives in the repository `perses/spec`. The deprecated copies
kept in `perses/perses` are now removed. If you still import them, replace the import paths as follows:

| Removed package (`github.com/perses/perses/...`) | Replacement (`github.com/perses/spec/...`)                 |
|--------------------------------------------------|------------------------------------------------------------|
| `pkg/model/api/v1/common`                        | `go/common` (`Plugin` is now in `go/plugin`)               |
| `pkg/model/api/v1/dashboard`                     | `go/dashboard`                                             |
| `pkg/model/api/v1/variable`                      | `go/dashboard/variable`                                    |
| `pkg/model/api/v1/plugin`                        | `go/plugin`                                                |
| `pkg/model/api/v1/datasource/http`               | `go/datasource/proxy/http`                                 |
| `pkg/model/api/v1/datasource/sql`                | `go/datasource/proxy/sql`                                  |

The deprecated types in `github.com/perses/perses/pkg/model/api/v1` (`DashboardSpec`, `Panel`, `PanelSpec`,
`PanelDisplay`, `Query`, `QuerySpec`, `Link`, `DatasourceSpec`, ...) are also removed. Use their equivalent from
`github.com/perses/spec/go/dashboard` and `github.com/perses/spec/go/datasource` (e.g. `dashboard.Spec`,
`dashboard.Panel`, `datasource.Spec`).

#### CUE: the old schemas are removed

For the same reason, the following CUE packages are removed:

| Removed package                                          | Replacement                                                                          |
|----------------------------------------------------------|--------------------------------------------------------------------------------------|
| `github.com/perses/perses/cue/model/api/v1/common`       | `github.com/perses/spec/cue/common` (`#Plugin` is in `github.com/perses/spec/cue/plugin`) |
| `github.com/perses/perses/cue/model/api/v1/dashboard`    | `github.com/perses/spec/cue/dashboard`                                               |
| `github.com/perses/perses/cue/model/api/v1/variable`     | `github.com/perses/spec/cue/dashboard/variable`                                      |
| `github.com/perses/perses/cue/model/api/v1/plugin`       | `github.com/perses/spec/cue/plugin`                                                  |
| `github.com/perses/perses/cue/model/api/v1/datasource/*` | `github.com/perses/spec/cue/datasource/proxy/http` and `.../proxy/sql`               |
| `github.com/perses/shared/cue/common/proxy`              | `github.com/perses/spec/cue/datasource/proxy/http` and `.../proxy/sql`               |

`v1.#DashboardSpec` and `v1.#Panel` are replaced by `dashboard.#Spec` and `dashboard.#Panel`
(from `github.com/perses/spec/cue/dashboard`).

If your plugin schemas were using the deprecated `github.com/perses/shared/cue/common/proxy` package, replace its
definitions as follows:

| Removed definition              | Replacement                    | Package                                     |
|---------------------------------|--------------------------------|---------------------------------------------|
| `proxy.#HTTPProxy`              | `http.#Proxy`                  | `github.com/perses/spec/cue/datasource/proxy/http` |
| `proxy.#HTTPAllowedEndpoint`    | `http.#AllowedEndpoint`        | `github.com/perses/spec/cue/datasource/proxy/http` |
| `proxy.#baseHTTPDatasourceSpec` | `datasource.#HTTPDatasourceSpec` | `github.com/perses/spec/cue/datasource`   |
| `proxy.#SQLProxy`               | `sql.#Proxy`                   | `github.com/perses/spec/cue/datasource/proxy/sql`  |
| `proxy.#MySQL`                  | `sql.#MySQLConfig`             | `github.com/perses/spec/cue/datasource/proxy/sql`  |
| `proxy.#Postgres`               | `sql.#PostgresConfig`          | `github.com/perses/spec/cue/datasource/proxy/sql`  |
| `proxy.#baseSQLDatasourceSpec`  | `datasource.#SQLDatasourceSpec` | `github.com/perses/spec/cue/datasource`    |

```cue
// Before
import "github.com/perses/shared/cue/common/proxy"

spec: proxy.#baseHTTPDatasourceSpec

// After
import "github.com/perses/spec/cue/datasource"

spec: datasource.#HTTPDatasourceSpec
```

Don't forget to bump the dependencies in your `cue.mod/module.cue` (`github.com/perses/shared/cue@v0` to `v0.55.x` and
`github.com/perses/spec/cue@v0` to `v0.3.x`).

#### `@perses-dev/core` is removed

As announced in v0.54.0, the package `@perses-dev/core` is no longer published, and the other packages don't depend on
it anymore. If you are still importing it, follow the migration described in
[Core package deprecated](#core-package-deprecated): its content is now available in `@perses-dev/spec`,
`@perses-dev/client`, `@perses-dev/components`, `@perses-dev/plugin-system` and `@perses-dev/dashboards`.

#### Toolchain and dependencies upgrade

The Perses npm packages (`@perses-dev/client`, `@perses-dev/components`, `@perses-dev/plugin-system`,
`@perses-dev/dashboards`, `@perses-dev/explore`) changed their requirements:

- **Node.js 24 (LTS)** and npm 11 are now required (`"engines": { "node": ">=24", "npm": ">=11" }`).
- **ESM only**: the CommonJS build (`dist/cjs`) is no longer published. `main` and `module` both point to the ES module
  output. Projects consuming these packages must support ES modules (e.g. no `require('@perses-dev/...')`).
- **React 17 is no longer supported**: the peer dependencies are now `react` and `react-dom` `^18.3.0`.
- **Zod 4**: `zod` is upgraded from `^3.25` to `^4`. The Zod schemas exported by the packages are typed with both their
  input and output types: `z.ZodType<T>` becomes `z.ZodType<T, T>` (e.g. `datasourcesSchema`, `roleSpecSchema`,
  `userSchema`...). Follow the [Zod 4 migration guide](https://zod.dev/v4/changelog) for your own schemas.
- `react-hook-form` is upgraded to `^7.87.0` and `@hookform/resolvers` to `^5.9.1`.
- `@perses-dev/spec` must be upgraded to `^0.3.0`.
- The code is compiled with TypeScript 7 and targets ES2023.

If you are maintaining a plugin, the easiest way to align your project is to compare it with a project freshly generated
with `percli plugin generate`. The main changes are:

- in `package.json`:
  - add `"type": "module"` and the `engines` field;
  - remove the `build:cjs` script and the file `.cjs.swcrc`;
  - set `"main": "lib/index.js"`;
  - upgrade the peer dependencies (`@perses-dev/*` to `^0.55.0`, `@perses-dev/spec` to `^0.3.0`, `react` / `react-dom`
    to `^18.3.0`, `react-hook-form` to `^7.87.0`, `@hookform/resolvers` to `^5.9.1`);
- in `.swcrc`, target `es2023`;
- in `tsconfig.json`, target `es2023` and use `"moduleResolution": "bundler"`;
- in `rsbuild.config.ts`, add `@perses-dev/client` to the shared singletons of the Module Federation configuration:

```ts
pluginModuleFederation({
  // ...
  shared: {
    // ...
    '@perses-dev/client': { singleton: true },
    '@perses-dev/components': { singleton: true },
    '@perses-dev/plugin-system': { singleton: true },
    '@perses-dev/explore': { singleton: true },
    '@perses-dev/dashboards': { singleton: true },
  },
});
```

#### Embedding Perses: the host must register its shared modules

The plugin runtime (Module Federation) is now ESM-native: the Perses packages are no longer loaded with `require` when a
remote plugin asks for them. Instead, the application hosting the plugins must provide its own instance of the Perses
packages **before** any plugin is loaded, using `registerHostSharedModules`. Otherwise, loading a remote plugin fails
with the error `Shared module "..." was not registered before a plugin tried to consume it`.

```tsx
// Before
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

```tsx
// After
import * as PersesClient from '@perses-dev/client';
import * as PersesComponents from '@perses-dev/components';
import * as PersesDashboards from '@perses-dev/dashboards';
import * as PersesExplore from '@perses-dev/explore';
import * as PersesPluginSystem from '@perses-dev/plugin-system';
import { registerHostSharedModules } from '@perses-dev/plugin-system';
import * as PersesSpec from '@perses-dev/spec';

// Provide the host's already-loaded Perses packages to the plugin runtime as Module Federation singletons.
registerHostSharedModules({
  '@perses-dev/spec': PersesSpec,
  '@perses-dev/client': PersesClient,
  '@perses-dev/components': PersesComponents,
  '@perses-dev/plugin-system': PersesPluginSystem,
  '@perses-dev/explore': PersesExplore,
  '@perses-dev/dashboards': PersesDashboards,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

#### `@perses-dev/components`: removed hooks and stricter types

To comply with the React Compiler rules, the following helpers are removed from `@perses-dev/components`:

- `useMemoized` and `useDeepMemo`: use React's `useMemo` instead.
- `useId(prefix)`: use React's `useId` instead.

```tsx
// Before
import { useId } from '@perses-dev/components';
const id = useId('MyComponent');

// After
import { useId } from 'react';
const id = `MyComponent-${useId()}`;
```

Some types are also stricter (`any` is replaced by `unknown`):

- `@perses-dev/client`: the `spec` of a `Resource` is now `unknown`. Narrow it (or cast it to the expected type) before
  using it.
- `@perses-dev/components`: the cell values of a `TableColumnConfig` are now `unknown`, and `cellDescription` now takes a
  `CellContext<T, unknown>`. In the cell callbacks, use `getValue<ValueType>()` when the value type is known, or narrow
  the value before using it.

#### `@perses-dev/dashboards`: annotation store refactor

The annotation data is now fetched on demand through the TanStack Query cache (like the panel queries) instead of being
loaded when the dashboard is opened and copied into the annotation store. As a consequence:

- `AnnotationHydrationWrapper` is removed.
- The `annotationState` field and the `setAnnotationState` action of the annotation store are removed.
- `useAnnotationsWithData`, `useAnnotationStates` and `useAnnotationSpecAndState` now fetch the data themselves. They
  must be used under the `QueryClientProvider`, the plugin registry, the time range, the variable and the datasource
  store providers.
- `usePanelAnnotationsWithData` no longer returns the hidden annotations.

### Upgrading from v0.53.0 to v0.54.0

#### Core package deprecated

We have deprecated the `core package` and accordingly moved all its types and functionalities into other packages including `spec`, `dashboards`, `components`, `plugin-system`, and `client`. We are planing to drop the `core package` completely in the subsequent release. Therefore, we kindly ask all contributors to avoid importing `core package` members, and instead use the relevant types from the mentioned packages. Furthermore, should your PRs already import `core` members, you should replace them with the relevant types from the mentioned packages. This also means that meanwhile we cease developing `core`, because as it has been already mentioned the subsequent release will drop core completely.

The dependencies from `core` had been used in all repositories and different packages including `perses/perses` (the Perses app), `perses/plugins`, and `perses/shared`. Please note that the `shared` is the host of the of the `components`, `plugin-system`, `dashboards`, and `client` packages. The `spec` as its name suggests exposes the specifications and had no dependency to `core`. However, some of the core members have been moved to `spec` already.

The following example shows the `Table` plugin and its dependencies at the moment

```json
    "@perses-dev/components": "^0.54.0",
    "@perses-dev/spec": "^0.2.0",
    "@perses-dev/plugin-system": "^0.54.0",
    "@perses-dev/dashboards": "^0.54.0"
```

For instance, if you take a look at the imported members in `table\src\components\TablePanel.tsx` you find many types that used to be imported from `core`. Now, after this change the core has been replaced accordingly.

```typeScript
/* For example FormatOptions used to reside in core package 
   But now it is taken from @perses-dev/components
   Take a look at ui\core\src\model\units\units.ts
   You will find FormatOptions
   Now it is coming from 
   components\src\model\units.ts
*/
import {
  FormatOptions,
  formatValue,
  Table,
  TableCellConfigs,
  TableColumnConfig,
  transformData,
  useSelection,
} from '@perses-dev/components';
```
You as the contributor need to make sure that no `core` dependency is used in your changes. If it has been used already, it should be simply replaced with its equivalent from the mentioned packages. This should be no challenge as most of the IDEs suggest substitutes. For example, in VSCODE, if you can remove the `core` dependency, the IDE will suggest the substitutes. Simply select the suggested import and it will be added to your file automatically.

##### Plugin migration example (v0.53.1 to v0.54.0)

Let's for example, take a closer look at **a** plugin and see how it was in `v0.53.1` and how it changed in `v0.54.0`. 
The example has been inspired by the actual Table Plugin from the plugin repo.

So here in `v0.53.1`, the following types have been imported from `@perses-dev/core`

- `CalculationsMap`
- `formatValue`
- `QueryDataType`
- `TimeSeriesData`
- `transformData` 

After migrating to `v0.54.0`, we need to replace them with the proper substitute from the relevant packages.

```typeScript
/* v0.53.1 */
import { Table, TableCellConfigs, TableColumnConfig, useSelection } from '@perses-dev/components';
/* @perses-dev/core */
import { CalculationsMap, formatValue, QueryDataType, TimeSeriesData, transformData } from '@perses-dev/core';
import { useSelectionItemActions } from '@perses-dev/dashboards';
import {
  ActionOptions,
  PanelData,
  PanelProps,
  replaceVariablesInString,
  useAllVariableValues,
  VariableStateMap,
} from '@perses-dev/plugin-system';
/* OTHER IMPORTED MEMBERS*/

export const APlugin = (): ReactElement => {
  /**
   * THE PLUGIN LOGIC
   */
  return <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>{/* THE PLUGIN STRUCTURE */}</Box>;
};

```
When moving to `v.0.54.0` **the plugin itself remains INTACT and you do NOT need to change anything**.
The only thing that you need to do 

- remove the core dependencies
- find the relevant substitutes for the removed imported members

So, in `v.0.54.0` **only the import section of the plugin has changed and the rest remain as it is**. **Why?** Because, the same type has been moved to a different package while the structure is intact. 

```typeScript
/* v0.54.0 */
import {
  formatValue,
  Table,
  TableCellConfigs,
  TableColumnConfig,
  transformData,
  useSelection,
} from '@perses-dev/components';
import { useSelectionItemActions } from '@perses-dev/dashboards';
import {
  ActionOptions,
  CalculationsMap,
  PanelData,
  PanelProps,
  replaceVariablesInString,
  useAllVariableValues,
  VariableStateMap,
} from '@perses-dev/plugin-system';
import { QueryDataType, TimeSeriesData } from '@perses-dev/spec';
/* OTHER IMPORTED MEMBERS*/

export const APlugin = (): ReactElement => {
  /**
   * THE PLUGIN LOGIC
   */
  return <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>{/* THE PLUGIN STRUCTURE */}</Box>;
};
```

The following table, shows how in this example the imports have changed after moving to `v0.54.0` from `v.053.1`

| @perses-dev/core Types    | Types new package |
| -------- | ------- |
| CalculationsMap  | @perses-dev/plugin-system    |
| formatValue | @perses-dev/components     |
| transformData     | @perses-dev/components    |
| QueryDataType    | @perses-dev/spec    |
| TimeSeriesData    | @perses-dev/spec   |


If you already working on a change that has added new members to the `core`, you need to move them to the proper package accordingly. Where your new type should reside depends on its usage. Please note that if the new introduced member has only internal `Perses App` usage, it should reside in the `perses/perses`.

#### GO-SDK: Import path change

##### Query plugin definition

Since the definition of the dashboard and datasource has been moved to the repository `perses/spec`, few import path
needs to be updated.

If you are defining a query plugin, you probably have the following definition:

```go
package yourquery

import (
	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

const PluginKind = "YourLogQuery"

type PluginSpec struct {
	Datasource *datasource.Selector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Query      string               `json:"query" yaml:"query"`
}

type Option func(plugin *Builder) error

func create(query string, options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Query(query),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func YourLogQuery(expr string, options ...Option) query.Option {
	plg, err := create(expr, options...)
	return query.Option{
		Kind: plugin.KindLogQuery,
		Plugin: common.Plugin{
			Kind: PluginKind,
			Spec: plg,
		},
		Error: err,
	}
}
```

In this situation, you simply need to replace the import path of the `plugin` and `common` packages to
`"github.com/perses/spec/go/plugin"`:

```go
package yourquery

import (
	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/spec/go/plugin"
)

const PluginKind = "YourLogQuery"

type PluginSpec struct {
	Datasource *datasource.Selector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Query      string               `json:"query" yaml:"query"`
}

type Option func(plugin *Builder) error

func create(query string, options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Query(query),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func YourLogQuery(expr string, options ...Option) query.Option {
	plg, err := create(expr, options...)
	return query.Option{
		Kind: plugin.KindLogQuery,
		Plugin: plugin.Plugin{
			Kind: PluginKind,
			Spec: plg,
		},
		Error: err,
	}
}
```

Note that if you are using more things than `plugin` in the `github.com/perses/perses/pkg/model/api/v1/common` package,
you should also update the import path to `"github.com/perses/spec/go/common"`.

##### Datasource plugin definition

There are two possibilities:

1. If you are defining an HTTP datasource plugin with the simple struct:

```go
package yourdatasource

import "github.com/perses/perses/pkg/model/api/v1/datasource/http"

type PluginSpec struct {
	DirectURL string      `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy     *http.Proxy `json:"proxy,omitempty" yaml:"proxy,omitempty"`
}
```

In this case, we have provided a new struct `datasource.HTTPDatasourceSpec` from the package
`github.com/perses/spec/go/datasource` that can be used instead of defining it manually. You can simply removed your
struct and use the new one.

```go
package yourdatasource

import (
	"github.com/perses/perses/go-sdk/datasource"
	datasourceSpec "github.com/perses/spec/go/datasource"
)

const (
	PluginKind = "YourDatasource"
)

type Option func(plugin *Builder) error

func create(options ...Option) (Builder, error) {
	builder := &Builder{
		HTTPDatasourceSpec: datasourceSpec.HTTPDatasourceSpec{},
	}

	var defaults []Option

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	datasourceSpec.HTTPDatasourceSpec `json:",inline" yaml:",inline"`
}

func YourDatasource(options ...Option) datasource.Option {
	return func(builder *datasource.Builder) error {
		plugin, err := create(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin.HTTPDatasourceSpec
		return nil
	}
}

func Selector(datasourceName string) *datasource.Selector {
	return &datasource.Selector{
		Kind: PluginKind,
		Name: datasourceName,
	}
}
```

2. If you are defining a datasource plugin with a more complex struct, you can replace the import path of the `http`
   package to `"github.com/perses/spec/go/datasource/proxy/http"`.

```go
package yourdatasource

import "github.com/perses/spec/go/datasource/proxy/http"

type PluginSpec struct {
	DirectURL  string      `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy      *http.Proxy `json:"proxy,omitempty" yaml:"proxy,omitempty"`
	OtherField string      `json:"otherField,omitempty" yaml:"otherField,omitempty"`
}

```

### Upgrading from v0.52.0 to v0.53.0

#### Change in "Run Query" behavior in `MultiQueryEditor`

`MultiQueryEditor` component has a new mandatory method: `onQueryRun`.It will be called when the user click on the
button "Run Query".It's useful if you want to execute a query only when this button is clicked and not on every
`onChange` (previous Perses behavior).Now the `onChange` method is always called when something change in the editor.
On the Perses app, queries are only executed when the user click on the "Run Query" button, however changes are still
saved
if user save the dashboard without clicking on "Run Query".But embedded use-cases might want to execute queries on
every change,
so this new behavior allows both use-cases.

In parallel, the caching of queries has been greatly improved to avoid memory leaks on dashboard refresh. More info can
be found in related PR: [#3518](https: //github.com/perses/perses/pull/3518)
And queries errors are now displayed at the query level (before it was only displayed at the panel level, could be hard
to know which queries are causing issues).

About the breaking change, your code should change from this:

```tsx
export function FooExplorer(): ReactElement {
    const {
        data: {queries = []},
        setData,
    } = useExplorerManagerContext<FooExplorerQueryParams>();

    return (
        <Stack gap={2} sx={{width: '100%'}}>
            <MultiQueryEditor
                queryTypes={['ProfileQuery']}
                queries={queries}
                onChange={(newQueries) => setData({queries: queryDefinitions})}
            />
            <FooPanel queries={queries}/>
        </Stack>
    );
}

```

to this:

```tsx
export function FooExplorer(): ReactElement {
    const {
        data: {queries = []},
        setData,
    } = useExplorerManagerContext<FooExplorerQueryParams>();

    const [queryDefinitions, setQueryDefinitions] = useState<QueryDefinition[]>(queries);

    return (
        <Stack gap={2} sx={{width: '100%'}}>
            <MultiQueryEditor
                queryTypes={['ProfileQuery']}
                queries={queryDefinitions}
                onChange={(newQueries) => setQueryDefinitions(newQueries)}
                onQueryRun={() => setData({queries: queryDefinitions})}
            />
            <FooPanel queries={queries}/>
        </Stack>
    );
}
```

#### Variable migration changes

We realized variable migration script could be simplified & better follow CUE's good practices by replacing condition
blocks by constraints defined on the variable object. However to enable this we had to introduce a breaking change*:
where previously such schema was describing the remapping of a Grafana variable object named `#var`, it is now called
`#grafanaVar`. Thus if you had defined a schema looking like this:

```cue
package migrate

import "strings"

#var: _ 

if #var.type == "custom" || #var.type == "interval" {
    kind: "MyVariable"
    spec: {
        values: strings.Split(#var.query, ",")
    }
}
```

..the minimum change you need to do is this renaming:

```cue
package migrate

import "strings"

#grafanaVar: _ 

if #grafanaVar.type == "custom" || #grafanaVar.type == "interval" {
    kind: "MyVariable"
    spec: {
        values: strings.Split(#grafanaVar.query, ",")
    }
}
```

Then it is recommended to refactor to something like this:

```cue
package migrate

import "strings"

#grafanaVar: {
    type: "custom" | "interval"
    query: string
    ...
}

kind: "MyVariable"
spec: {
    values: strings.Split(#grafanaVar.query, ",")
}
```

*We believe the trade‑off was worth introducing this breaking change, as we expect very few (if any) people to have
written such variable migration schemas outside of the Perses organization. However, if you are impacted, please reach
out to us! Learning more about our community helps us make better future decisions by having a clearer understanding of
potential impacts.

#### GO-SDK Change in the way to define a query plugin

In the previous version of the GO-SDK, a query plugin was defined by using the Query builder. The issue with this
approach is that it was not possible to provide the high level query type as it was hardcoded in the query builder.

This was not a problem for the Perses app as we only have one query type until recently. It changed with the
introduction of the new query types:  "ProfileQuery", "LogQuery" and "TraceQuery". To support this new use-case, we had
to introduce a breaking change in the way to define a query plugin.

Now, instead of using the Query builder, you need to fill a struct `query.Option` that contains the query plugin and the
high level query type.

If we take the Prometheus plugin as an example, the implementation will change from this:

```go
package query

import (
	"github.com/perses/perses/go-sdk/query"
)

func PromQL(expr string, options ...Option) query.Option {
	return func(builder *query.Builder) error {
		plugin, err := create(expr, options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin
		return nil
	}
}

```

to this:

```go
package query

import (
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
)

func PromQL(expr string, options ...Option) query.Option {
	plg, err := create(expr, options...)
	return query.Option{
		Kind: plugin.KindTimeSeriesQuery,
		Plugin: common.Plugin{
			Kind: PluginKind,
			Spec: plg,
		},
		Error: err,
	}
}

```

#### Plugin Dev API change.

In this new version, we are introducing a plugin version and registry. As a side effect, the API
handling the load of the plugins in development has changed.

Therefore, you absolutely need to upgrade the CLI to the latest version to be able to load your plugin in development
mode.
