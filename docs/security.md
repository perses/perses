# Security considerations

This page describes the security-relevant deployment choices an operator should
be aware of when running Perses. For reporting vulnerabilities, see
[SECURITY.md](https://github.com/perses/perses/blob/main/SECURITY.md).
Published advisories are listed under the Security tab of the repository.

## Authentication is disabled by default

With the shipped default configuration, `security.enable_auth` is `false` and
every endpoint of the API is reachable without credentials. In that mode, any
client that can reach the API can:

- create, modify and delete projects, dashboards, datasources, secrets and
  other resources;
- use the datasource proxy (see below) to reach any URL the server can reach.

This is convenient for local and evaluation deployments, but in any shared or
internet-exposed deployment you should set `security.enable_auth: true` and
configure an authentication provider (e.g.
`security.authentication.providers.enable_native: true`).

## Datasource proxy

The datasource proxy forwards requests to the datasource's configured URL. A few
properties of this design deserve attention:

- **Where the proxy may send requests.** A datasource URL can point at any
  host the Perses server can reach, including loopback, link-local and private
  addresses. Anyone who can create a datasource (anyone, when authentication is
  disabled) can therefore make the server issue requests to internal services
  and read the responses. Restrict datasource creation to trusted users, and
  prefer network-level controls (egress policy, network policies) as defense in
  depth.
- **Secrets are attached to proxied requests.** When a datasource references a
  secret, the proxy decrypts the secret and attaches it to the outbound
  request (for example as a Basic authorization header). A user who can use a
  datasource therefore has access to the plaintext of every secret that
  datasource references. Grant datasource access with the same care as access
  to the secrets themselves, and keep the list of referenced secrets minimal.
- **Connection timeout of HTTP proxy datasources.** A datasource using the
  HTTP proxy can define the timeout used to connect to its URL, but it can only
  lower the timeout set by the server: it is bounded by
  `datasource.proxy.http.max_timeout`, which defaults to
  `datasource.proxy.http.default_timeout` (30s). A long timeout keeps
  goroutines and sockets busy against unreachable hosts, so only increase
  `max_timeout` if you need to, and keep it as low as possible. These settings
  don't apply to SQL proxy datasources.
- **Responses are served under the Perses origin.** The proxy returns the
  response of the datasource from the Perses server, so the browser would
  apply it to the Perses origin. To prevent a datasource from running scripts
  with the session of a user opening a link to it, setting cookies, or
  redirecting to another website, every proxied response gets the
  `Content-Security-Policy: sandbox; default-src 'none'; frame-ancestors 'none'`
  and `X-Content-Type-Options: nosniff` headers. The headers that would apply
  to the Perses origin are also removed: `Set-Cookie`, `Clear-Site-Data`,
  `Refresh`, `Strict-Transport-Security`, `Alt-Svc`, `Service-Worker-Allowed`,
  the CORS headers (`Access-Control-*`, defined by `security.cors` instead),
  and the `Location` / `Content-Location` headers that are not relative. As the
  [Content Security Policy](#content-security-policy) of the UI allows the
  scripts of the Perses origin, the proxy also refuses the requests made to
  load a script or a worker (`Sec-Fetch-Dest`), and serves the JavaScript
  responses as `text/plain`, which the browsers refuse to run. The Perses UI
  queries the proxy with `fetch`, so this has no impact on it, but the UI of a
  datasource (for example the Prometheus UI) can no longer be browsed through
  the proxy.

## Dashboard content

Anyone who can edit a dashboard decides what it displays to the users who open
it, including users with more permissions than the editor. Perses therefore
considers the content of a dashboard as untrusted when it displays it:

- **Links.** The URL of a dashboard link or a panel link must be relative or
  use one of the following schemes: `http`, `https`, `mailto`, `tel`, `sms`,
  `slack`, `msteams`, `vscode`, `vscode-insiders`, `zoommtg`. The API rejects
  any other scheme, such as `javascript:` or `data:`, when the dashboard is
  saved.
- **URLs containing variables.** The final URL is only known once the variables
  are interpolated, in the browser, and the value of a variable can come from
  the URL of the page. The API can't verify such a URL: the UI verifies it once
  interpolated, and doesn't follow it when its scheme isn't allowed. The
  official panel plugins verify the links they build (Table data links, links
  to a trace, ...) the same way.
- **Markdown.** The Markdown panel converts its text to HTML in the browser,
  after interpolating the variables, and sanitizes the result with
  [DOMPurify](https://github.com/cure53/DOMPurify), which removes the scripts,
  the event handlers and the links using a scheme like `javascript:`. The API
  doesn't validate the Markdown text: the protection is the sanitization done
  in the browser.
- **Plugins.** A plugin is code that runs in the Perses origin, with the
  session of the user. Only install plugins you trust.

## Secrets at rest

Secrets are encrypted with `security.encryption_key`. If no key is configured,
a default value is used — fine for evaluation, unacceptable in production.
Generate a random key (32 characters) and configure it via
`security.encryption_key` or `security.encryption_key_file`.

Secret specs may reference files on the server (TLS keys, credential files).
Since file references allow reading arbitrary server paths, they are rejected
unless the referenced path is inside a directory listed in
`security.secret_file_allowed_directories`. Enable that list before using
file-based secrets.

## SQL database backend

When using the SQL backend:

- Use a dedicated database and a dedicated, least-privilege database user for
  Perses.
- The SQL datasource proxy sends read-only queries to the target database. As
  defense in depth, configure the datasource's database user with `SELECT`-only
  privileges — text-level query validation cannot be the only boundary.
- With `database.sql.case_sensitive: true`, ensure the database uses a
  case-sensitive collation; otherwise case variants of names alias each other
  even though the setting is enabled.

## Content Security Policy

The pages of the UI are sent with a `Content-Security-Policy` header, which
restricts what the browser can run in the Perses origin. It's a second layer of
protection against a script injected in the content of a dashboard (for example
through a link URL): even if such a script reached a page, the browser wouldn't
run it.

The default policy is
`script-src 'self' 'unsafe-eval'; object-src 'none'; base-uri 'self'`:

- `script-src 'self' 'unsafe-eval'`: only the scripts served by Perses, the UI
  and the plugins, can run (the datasource proxy refuses to serve the responses
  of the datasources as scripts). The inline scripts, the inline event handlers
  and the `javascript:` URLs are blocked. `eval()` is allowed, as the module
  federation runtime, which loads the plugins, relies on it.
- `object-src 'none'`: the `<object>` and `<embed>` elements can't load
  anything.
- `base-uri 'self'`: a `<base>` element can't change the URL against which the
  relative URLs are resolved.

The policy can be changed, or disabled, with
`security.content_security_policy` (see the
[configuration](./configuration/configuration.md#content-security-policy-config)).
For example, if a reverse proxy injects a script in the pages (analytics,
monitoring, ...), allow its origin in `script-src`, and check the console of
the browser for the reports of the blocked resources. A plugin must not rely on
inline scripts or `javascript:` URLs.
