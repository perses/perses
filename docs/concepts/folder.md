# Folder

Folders let you organize [dashboards](./dashboard.md) within a [project](./project.md) using a tree structure. Instead of displaying dashboards as a flat list, Perses can group them into folders and subfolders to mirror how teams structure their observability content.

A folder is a project-scoped resource. Each folder stores an ordered tree of items in its specification. Items can be either dashboards or nested subfolders.

## Folder tree

The folder tree is defined in `spec.items`. Each entry is a `FolderItem` with one of two kinds:

- **`Folder`**: a subfolder that can contain its own `items`
- **`Dashboard`**: a reference to an existing dashboard in the same project (`metadata.name`)

Example structure:

```yaml
kind: "Folder"
metadata:
  name: "platform"
  project: "my-team"
spec:
  display:
    name: "Platform"
  items:
    - kind: "Folder"
      name: "kubernetes"
      items:
        - kind: "Dashboard"
          name: "cluster-overview"
        - kind: "Dashboard"
          name: "node-exporter"
    - kind: "Dashboard"
      name: "global-health"
```

In this example, `platform` is the root folder resource. It contains one subfolder (`kubernetes`) and one dashboard at the top level.

## Display name

Like dashboards, folders support an optional display name through `spec.display.name`. When set, the UI shows this value instead of `metadata.name`.

## Constraints

Perses validates folder trees when they are created or updated:

- A **dashboard can appear only once** in a given folder tree. The same dashboard cannot be referenced in multiple subfolders of the same folder resource.
- A **dashboard item cannot contain nested items**. Only `Folder` items can have an `items` list.
- Every item must have a non-empty `name`.
- Each item `kind` must be either `Dashboard` or `Folder`.

These rules keep the UI tree view unambiguous when navigating to a dashboard from a folder path.

## Working with folders

### Using the UI

From a project's dashboard list, you can switch to the tree view to browse folders and subfolders. Depending on your permissions, you can:

- Create a root folder
- Add subfolders inside an existing folder
- Move dashboards into folders
- Edit or delete folders and subfolders

Folders do not replace dashboards: dashboards remain standalone resources in the project. Folder resources only define how they are grouped and displayed.

### Using the API and CLI

Folders can be managed through the Perses API or CLI (`percli apply`, `percli get folder`, etc.). See the [Folder API documentation](../api/folder.md) for the resource schema and available endpoints.

Folders can also be [provisioned](../configuration/provisioning.md) like other Perses resources by placing YAML files in a configured provisioning folder.

## Related resources

- [Dashboard](./dashboard.md): the dashboards referenced by folder items
- [Project](./project.md): the workspace that owns folders and dashboards
