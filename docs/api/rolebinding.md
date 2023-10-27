# RoleBinding

A role binding grants the permissions defined in a role to a user or set of users.
It holds a list of subjects (users or teams) and a reference to the role being granted. A `RoleBinding` grants permissions within a specific project whereas a `GlobalRoleBinding` grants that access global-wide.

A `RoleBinding` may reference any `Role` in the same project. Similarly, a `GlobalRoleBinding` can reference any `GlobalRole`.

## Choose a scope

There are two different scopes in which you can define a RoleBinding, depending on the role scope.

- for GlobalRole, use GlobalRoleBinding
- for Role, use RoleBinding

### Project level

In case you would like to set a role binding for a Role, you will need to create a `RoleBinding`.

```yaml
  kind: "RoleBinding"
  metadata:
    name: <string>
    project: <string>
  spec: <rolebinding_spec>
```

### Global level

In case you would like to set a role binding for a GlobalRole , you will need to create a `GlobalRoleBinding`.

```yaml
  kind: "GlobalRoleBinding"
  metadata:
    name: <string>
  spec: <rolebinding_spec>
```

## RoleBinding specification

```yaml
  # Name of the Role or GlobalRole concerned by the role binding (metadata.name)
  role: <string>
  # Subjects that will inherit permissions from the role
  subjects: 
    - <subject_spec>
```

### `<subject_spec>`

```yaml
  # The type of the subject. For example: `User`
  kind: <string>

  # The name of the subject (metadata.name)
  name: <string>
```

### More info about authorization

Please look at the [documentation](../authorization.md) to know more about permissions and role bindings.


## API definition

### `RoleBinding`

#### Get a list of `RoleBinding`

```bash
GET /api/v1/projects/<project_name>/rolebindings
```

URL query parameters:

- name = `<string>` : should be used to filter the list of RoleBindings based on the prefix name.

Example:

The following query should return an empty list or a list containing roleBindings.

```bash
GET /api/v1/projects/<project_name>/rolebindings?name=ownerRB
```

#### Get a single `RoleBinding`

```bash
GET /api/v1/projects/<project_name>/rolebindings/<rolebinding_name>
```

#### Create a single `RoleBinding`

```bash
POST /api/v1/projects/<project_name>/rolebindings
```

#### Update a single `RoleBinding`

```bash
PUT /api/v1/projects/<project_name>/rolebindings/<rolebinding_name>
```

#### Delete a single `RoleBinding`

```bash
DELETE /api/v1/projects/<project_name>/rolebindings/<rolebinding_name>
```

### `GlobalRoleBinding`

#### Get a list of `GlobalRoleBinding`

```bash
GET /api/v1/globalrolebindings
```

URL query parameters:

- name = `<string>` : should be used to filter the list of RoleBinding based on the prefix name.

Example:

The following query should return an empty list or a list containing global rolebindings.

```bash
GET /api/v1/globalRoleBindings?name=adminRB
```

#### Get a single `GlobalRoleBinding`

```bash
GET /api/v1/globalrolebindings/<name>
```

#### Create a single `GlobalRoleBinding`

```bash
POST /api/v1/globalrolebindings
```

#### Update a single `GlobalRoleBinding`

```bash
PUT /api/v1/globalrolebindings/<name>
```

#### Delete a single `GlobalRoleBinding`

```bash
DELETE /api/v1/globalrolebindings/<name>
```
