# Folder

A `Folder` organizes dashboards within a [project](./project.md) using a tree of folder and dashboard references.

It is defined as follows:

```yaml
kind: "Folder"
metadata:
  name: <string>
  project: <string>
spec: <folder_specification>
```

See the next sections for details about the folder specification and API endpoints.

## Folder specification

```yaml
# Optional display name shown in the UI instead of metadata.name
display:
  name: <string> # Optional

# Ordered tree of dashboards and subfolders
items:
  - <FolderItem specification> # Optional
```

### FolderItem specification

Each item in `spec.items` describes either a subfolder or a dashboard reference:

```yaml
# kind must be "Folder" or "Dashboard"
kind: <string>

# When kind is "Dashboard", name is the dashboard metadata.name in the same project.
# When kind is "Folder", name is the subfolder label in the tree.
name: <string>

# Nested items. Allowed only when kind is "Folder".
items:
  - <FolderItem specification> # Optional
```

### Validation rules

When creating or updating a folder, Perses validates the tree:

- Each dashboard referenced in `spec.items` can appear **only once** in that folder resource.
- The same dashboard can be referenced in **different** folder resources within the same project.
- A `Dashboard` item cannot contain nested `items`.
- Every item must have a non-empty `name`.
- Each item `kind` must be `Folder` or `Dashboard`.

### Example

```yaml
kind: "Folder"
metadata:
  name: "platform"
  project: "my-team"
spec:
  display:
    name: "Platform Monitoring"
  items:
    - kind: "Folder"
      name: "kubernetes"
      items:
        - kind: "Dashboard"
          name: "cluster-overview"
    - kind: "Dashboard"
      name: "global-health"
```

## API definition

### Get a list of `Folder`

```bash
GET /api/v1/projects/<project_name>/folders
```

You can also list folders across projects:

```bash
GET /api/v1/folders
```

URL query parameters:

- `name` = `<string>`: filters folders based on `metadata.name` (prefix match).
- `project` = `<string>`: filters folders by project (available on `GET /api/v1/folders`).
- `metadata_only` = `<boolean>`: when `true`, returns only folder metadata without the full `spec`.

### Get a single `Folder`

```bash
GET /api/v1/projects/<project_name>/folders/<folder_name>
```

### Create a single `Folder`

```bash
POST /api/v1/projects/<project_name>/folders
```

You can also create a folder by posting to the global folders endpoint when `metadata.project` is set in the body:

```bash
POST /api/v1/folders
```

### Update a single `Folder`

```bash
PUT /api/v1/projects/<project_name>/folders/<folder_name>
```

### Delete a single `Folder`

```bash
DELETE /api/v1/projects/<project_name>/folders/<folder_name>
```

Deleting a folder removes the folder resource only. Referenced dashboards are not deleted.
