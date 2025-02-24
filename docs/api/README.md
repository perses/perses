# Reference

This section will give you an insight on every resource supported by the Perses API. While it can give you some
explanations about the purpose of each resource, this documentation is mainly for users that would like to interact
directly with the API and manipulate the resources without using the UI.

On the different documentations, you will find the definition of each resource in the yaml format.
Brackets indicate that a parameter is optional.

Generic placeholders are defined as follows:

- `<boolean>`: a boolean that can take the values `true` or `false`
- `<duration>`: a duration matching the regular
  expression `((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)`,
  e.g. `1d`, `1h30m`, `5m`, `10s`
- `<filename>`: a valid path in the current working directory
- `<path>`: a valid URL path
- `<int>`: an integer value
- `<secret>`: a regular string that is a secret, such as a password
- `<string>`: a regular string

## Table of contents

- [Project](./project.md)
- [Dashboard](./dashboard.md)
    - [Specification](./dashboard.md#dashboard-specification)
    - [API definition](./dashboard.md#api-definition)
- [Datasource](./datasource.md)
    - [Choose a scope](./datasource.md#choose-a-scope)
    - [Specification](./datasource.md#datasource-specification)
    - [API definition](./datasource.md#api-definition)
- [EphemeralDashboard](./ephemeral-dashboard.md)
    - [Specification](./ephemeral-dashboard.md#ephemeral-dashboard-specification)
    - [API definition](./ephemeral-dashboard.md#api-definition)
- [Secret](./secret.md)
    - [Specification](./secret.md#secret-specification)
    - [API definition](./secret.md#api-definition)
- [User](./user.md)
    - [Specification](./user.md#user-specification)
    - [API definition](./user.md#api-definition)
- [Variable](./variable.md)
    - [Choose a scope](./variable.md#choose-a-scope)
    - [Specification](./variable.md#variable-specification)
    - [API definition](./variable.md#api-definition)
- [Role](./role.md)
    - [Choose a scope](./datasource.md#choose-a-scope)
    - [Specification](./role.md#role-specification)
    - [API definition](./role.md#api-definition)
- [RoleBinding](./rolebinding.md)
    - [Choose a scope](./rolebinding.md#choose-a-scope)
    - [Specification](./rolebinding.md#rolebinding-specification)
    - [API definition](./rolebinding.md#api-definition)

