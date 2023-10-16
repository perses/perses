# Project

A project can be defined as a workspace. It's the place where users will spend most of their time creating dashboards,
variables and datasources.

**You need to own a project if you want to create a dashboard**

Creating a project is as simple as providing its name:

```yaml
kind: "Project"
metadata:
  name: <string>
```

## API definition

### Get a list of `Project`

```bash
GET /api/v1/projects
```

URL query parameters:

- name = `<string>` : filters the list of projects based on their names (prefix).

#### Get a single `Project`

```bash
GET /api/v1/projects/<name>
```

#### Create a single `Project`

```bash
POST /api/v1/projects
```

#### Update a single `Project`

```bash
PUT /api/v1/projects/<name>
```

#### Delete a single `Project`

```bash
DELETE /api/v1/projects/<name>
```
