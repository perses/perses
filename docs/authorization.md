# Authorization / Permission

*WIP: The authorization is still not implemented in Perses*

Perses will use a Role-based access control (RBAC) for regulating access to resources based on the role of the user.
The RBAC API is based on four kinds of resource: GlobalRole, Role, GlobalRoleBinding and RoleBinding.
Perses RBAC implementation is highly inspired by K8S RBAC implementation.

## Role and GlobalRole

An RBAC `Role` or `GlobalRole` contains a set of permissions (rules). Permissions are purely additive (there are no "deny" permissions).

A `Role` defines a set of permissions within a particular project. When you create a `Role` you need to specify the project it belongs in.
`GlobalRole`, by contrast, is not limited to a project scope.

### Role example

Here is an example of Role in "MySuperProject" project that can be used to grant edit access to dashboards:

```yaml
kind: Role
metadata:
  name: dashboard-editor
  project: MySuperProject
spec:
  permissions:
    - action: edit
      scopes: ["Dashboard"]
```

### Global Role example

A `GlobalRole` can be used to grant the same permissions as a Role. However, because `GlobalRole` are global, you can also use them to grant access to:
- global resources (like Global Datasources, Global Variables, Users, ...)
- project resources (like Dashboards) across all projects

Here is an example of a `GlobalRole` that can be used to grant edit access to variables in all projects:

```yaml
kind: GlobalRole
metadata:
  name: variable-editor
spec:
  permissions:
    - action: edit
      scopes: ["Variable"]
```

## RoleBinding and GlobalRoleBinding

A role binding grants the permissions defined in a role to a user or set of users.
It holds a list of subjects (users or teams) and a reference to the role being granted. A `RoleBinding` grants permissions within a specific project whereas a `GlobalRoleBinding` grants that access global-wide.

A `RoleBinding` may reference any `Role` in the same project. Similarly, a `GlobalRoleBinding` can reference any `GlobalRole`.

### RoleBinding example

Here is an example of a `RoleBinding` that grants the "dashboard-editor" `Role` to the user "jane" within the "MySuperProject" project. This allows "jane" to edit dashboards in the "MySuperProject" project.

```yaml
kind: RoleBinding
metadata:
  name: edit-dashboards
  project: MySuperProject
spec:
  role: dashboard-editor
  subjects:
    - kind: User
      name: jane
```

### GlobalRoleBinding example

Here is an example of a `GlobalRoleBinding` that grants the "variable-editor" `GlobalRole` to the user "jane" within all projects. This allows "jane" to edit variables in all projects.

```yaml
kind: GlobalRoleBinding
metadata:
  name: edit-variables
spec:
  role: variable-editor
  subjects:
    - kind: User
      name: jane
```

### RoleBinding and GlobalRoleBinding update restriction

After you create a binding, you cannot change the `Role` or `GlobalRole` that it refers to. If you try to change a binding's role, you get a validation error. If you do want to change the role for a binding, you need to remove the binding object and create a replacement.

There are two reasons for this restriction:
- Making role immutable allows granting someone update permission on an existing binding object, so that they can manage the list of subjects, without being able to change the role that is granted to those subjects.
- A binding to a different role is a fundamentally different binding. Requiring a binding to be deleted/recreated in order to change the roleRef ensures the full list of subjects in the binding is intended to be granted the new role (as opposed to enabling or accidentally modifying only the roleRef without verifying all of the existing subjects should be given the new role's permissions).

## Referring to resources

In Perses API, resources are identified and accessed using a string, corresponding to the name in the metadata. You can also refer to all resources using the wildcard `*` character.
Here is an example for granting edit permissions to all resources in all projects:

```yaml
kind: GlobalRole
metadata:
  name: admin-editor
spec:
  permissions:
    - action: edit
      scopes: ["*"]
```

## RBAC Synchro

Roles and RoleBindings of an user are stored in the user's JWT.
If Perses is deployed with multiple instances, Perses RBAC roles and role bindings cache need to be synchronized/replicated between all instances.
To do that there are multiple mechanisms:
- cache is refreshed every X minutes
- cache is refreshed if roles and role bindings retrieve from the user's JWT are different from the cache
- cache is refreshed when a new role is created, edited or deleted
- cache is refreshed when a new rolebinding is created, edited or deleted
