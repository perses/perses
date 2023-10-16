# Project

A project can be defined as a workspace. It's the place where user will spend most of their time, creating dashboard and
datasource.

**You need to own a project if you want to create a dashboard**

Creating a project is simple as providing the name:

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

- name = `<string>` : should be used to filter the list of project based on the prefix name.

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
