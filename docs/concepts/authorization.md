# Authorization

Perses uses a Role-based access control (RBAC) system to regulate access to resources based on user roles.

The RBAC API includes four kinds of resources: `GlobalRole`, `Role`, `GlobalRoleBinding`, and `RoleBinding`.

The RBAC implementation in Perses is heavily inspired by Kubernetes' RBAC model.

## Role and GlobalRole

An RBAC `Role` or `GlobalRole` defines a set of permissions (rules). Permissions are purely additive, meaning there are
no "deny" permissions.

- A `Role` specifies permissions within a specific project. The project must be defined when the `Role` is created.
- A `GlobalRole` applies to resources globally and is not limited to a project scope.

### Role Example

This example defines a `Role` in the "MySuperProject" project that grants edit access to dashboards:

```yaml
kind: Role
metadata:
  name: dashboard-editor
  project: MySuperProject
spec:
  permissions:
    - actions: [ "edit" ]
      scopes: [ "Dashboard" ]
```

### Global Role example

A `GlobalRole` can grant access to both global resources (e.g., global datasources, global variables, users) and
project-specific resources (like dashboards) across all projects.

Here is an example of a GlobalRole that grants edit access to variables across all projects:

```yaml
kind: GlobalRole
metadata:
  name: variable-editor
spec:
  permissions:
    - actions: [ "edit" ]
      scopes: [ "Variable" ]
```

## RoleBinding and GlobalRoleBinding

A role binding grants the permissions defined in a role to a user or set of users.
It holds a list of subjects (users or teams) and a reference to the role being granted. A `RoleBinding` grants
permissions within a specific project whereas a `GlobalRoleBinding` grants that access global-wide.

A `RoleBinding` may reference any `Role` in the same project. Similarly, a `GlobalRoleBinding` can reference any
`GlobalRole`.

### RoleBinding example

Here is an example of a `RoleBinding` that grants the "dashboard-editor" `Role` to the user "jane" within the
"MySuperProject" project. This allows "jane" to edit dashboards in the "MySuperProject" project.

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

Here is an example of a `GlobalRoleBinding` that grants the "variable-editor" `GlobalRole` to the user "jane" within all
projects. This allows "jane" to edit variables in all projects.

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

Once you have created a `RoleBinding` or `GlobalRoleBinding`, you cannot update it to change the role it refers to.
If you try to change a binding's role, you get a validation error.
If you do want to change the role in the binding's spec, then you will need to remove the binding object and create a
new one.

This restriction is in place for the following reasons:

- If you are unable to update the role in a binding's spec, then you will not grant by accident a user more permissions
  than they should have.
- We consider that a binding to a different role is fundamentally differen

## Referring to resources

In Perses API, resources are identified and accessed using a string, corresponding to the name in the metadata. You can
also refer to all resources using the wildcard `*` character.
Here is an example for granting edit permissions to all resources in all projects:

```yaml
kind: GlobalRole
metadata:
  name: admin-editor
spec:
  permissions:
    - actions: [ "edit" ]
      scopes: [ "*" ]
```

## RBAC Synchro

Roles and RoleBindings of a user are stored in the user's JWT.
If Perses is deployed with multiple instances, Perses RBAC roles and role bindings cache need to be
synchronized/replicated between all instances.
To do that, there are multiple mechanisms:

- cache is refreshed every X minutes
- cache is refreshed if roles and rolebindings retrieved from the user's JWT are different from the cache
- cache is refreshed when a new role is created, edited or deleted
- cache is refreshed when a new rolebinding is created, edited or deleted


## Kubernetes

When enabled in config, Perses can use Kubernetes RBAC for Namespaces, PersesDashboards (operator CRD), and PersesDatasources (operator CRD). 
More information can be found in the [config docs](../configuration/configuration.md).All other permissions for a user are pulled from the `authorization.guest_permissions` permission set. 
