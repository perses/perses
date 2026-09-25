# Security considerations

This page describes the security-relevant deployment choices an operator should
be aware of when running Perses. For reporting vulnerabilities, see
[SECURITY.md](../SECURITY.md).

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

The datasource proxy forwards requests to the datasource's configured URL. Two
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

## Reporting

Please report security issues privately to the maintainers, per
[SECURITY.md](../SECURITY.md). Published advisories are listed under the
Security tab of the repository.
