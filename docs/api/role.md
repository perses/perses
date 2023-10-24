# Role

## Choose a scope

There are two different scopes in which you can define a Role, depending on how much you want it to be shared.

- for global scope, use GlobalRole
- for project scope, use Role

### Project level

In case you would like to set permissions at Project level, you will need to create a `Role`.

```yaml
  kind: "Role"
  metadata:
    name: <string>
    project: <string>
  spec: <role_spec>
```

### Global level

In case you would like to set permissions at Global level , you will need to create a `GlobalRole`.

```yaml
  kind: "GlobalRole"
  metadata:
    name: <string>
  spec: <role_spec>
```

## Role specification

```yaml
  # List of permissions owned by the role
  permissions: [<permission>]
```

### Permission definition

```yaml
  # The type of the action. For example: `create`, `read`, `update` or `delete`
  action: <string>

  # The list of kind targeted by the permission. For example: `Datasource`, `Dashboard`, ...
  # With Role, you can't target global kinds
  scopes: [<string>]
```

### More info about authorization

Please look at the [documentation](../authorization.md) to know more about permissions and roles.


## API definition

### `Role`

#### Get a list of `Role`

```bash
GET /api/v1/projects/<project_name>/roles
```

URL query parameters:

- name = `<string>` : should be used to filter the list of Roles based on the prefix name.

Example:

The following query should return an empty list or a list containing roles.

```bash
GET /api/v1/projects/<project_name>/roles?name=owner
```

#### Get a single `Role`

```bash
GET /api/v1/projects/<project_name>/roles/<role_name>
```

#### Create a single `Role`

```bash
POST /api/v1/projects/<project_name>/roles
```

#### Update a single `Role`

```bash
PUT /api/v1/projects/<project_name>/roles/<role_name>
```

#### Delete a single `Role`

```bash
DELETE /api/v1/projects/<project_name>/roles/<role_name>
```

### `GlobalRole`

#### Get a list of `GlobalRole`

```bash
GET /api/v1/globalroles
```

URL query parameters:

- name = `<string>` : should be used to filter the list of Role based on the prefix name.

Example:

The following query should return an empty list or a list containing global roles.

```bash
GET /api/v1/globalRoles?name=admin
```

#### Get a single `GlobalRole`

```bash
GET /api/v1/globalroles/<name>
```

#### Create a single `GlobalRole`

```bash
POST /api/v1/globalroles
```

#### Update a single `GlobalRole`

```bash
PUT /api/v1/globalroles/<name>
```

#### Delete a single `GlobalRole`

```bash
DELETE /api/v1/globalroles/<name>
```
