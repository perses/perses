# Datasource

## Different Datasource scope

We have three different ways to define a datasource, depending on the scope we want to give
to the datasource.

### Dashboard level

Like in the first draft, we can extend the dashboard spec to include a list of datasources:

```typescript
interface DashboardSpec {
  // ... existing dashboard spec ...
  datasources: Record<string, DatasourceSpec>;
}
```

Of course, the scope of such definition is the dashboard where it is defined.
It cannot be used outside the dashboard.

**Note**: We don’t really have a use case in mind, but as it is not really complicated to have it in the dashboard
specification, we decided to support it.
Once we will have user feedbacks, if they don’t like it, it won’t be that hard to remove as well.

### Project level

In case you would like to share a datasource across different dashboards in the **same** project, you will need to
create a Datasource.

```yaml
  kind: "Datasource"
  metadata:
    name: <string>
    project: <string>
  spec: <datasource_spec>
```

### Global level

When we talk about scope and user permission in a REST API, the easiest way is to associate one permission per endpoint.
If we want to provide a datasource shared by all projects, then it makes sense to create a different object that is
living outside a project.

That’s why we will have a new resource called `GlobalDatasource`

```yaml
  kind: "GlobalDatasource"
  metadata:
    name: <string>
  spec: <datasource_spec>
```

## Datasource specification

```yaml
  [ display: <display_spec> ]

  # If true, then it's the default datasource for the type defined in the plugin.
  [ default: <boolean> | default = false ]

  # The definition of the plugin datasource
  plugin: <plugin>
```

### Plugin definition

```yaml
  # The type of the datasource. For example, `PrometheusDatasource`
  kind: <string>

  # The actual definition of the datasource. It will depend on the type defined in the previous field `kind`
  spec: <plugin_spec>
```

We are supporting only prometheus as a datasource for the moment.
Please look at the [documentation](./plugin/prometheus.md#datasource) to know the spec for the Prometheus datasource.

### Selecting / Referencing a Datasource

In the panels, you will be able to select a datasource. Like proposed in the first draft, the selector will be like
this:

```typescript
interface DatasourceSelector {
  kind: string;
  // name is the unique name of the datasource to use
  // If name is omitted, that effectively means "use the default datasource for this kind".
  name?: string;
}
```

Priority is `"Local datasource in the dashboard" > "Project datasource" > "Global datasource"`.

So if by any chance you have a local datasource that is named exactly like a Project datasource, or a Global datasource,
we will consider that the user intentionally wanted to override the upper datasource. We will use the one with the
smallest scope.

### How to use the Perses' proxy

As described before, you can provide a proxy configuration that will be used by the Perses server to redirect any
queries to the datasource.

It means in case of the Prometheus datasource, if the field `directUrl` is not set, then the FE needs to use the Perses
server to contact the datasource.
For that, the FE will have to determinate which URL should be used to contact the Perses server based on what kind of
datasource is used.

* datasource is at project scope.

  ```
    var datasource; 
    if datasource.kind == 'Datasource'; then 
      url= '/proxy/projects' + datasource.metadata.project + '/datasources/' + datasource.metadata.name 
  ```

* datasource is at global scope.

  ```
    var datasource; 
    if datasource.kind == 'GlobalDatasource'; then 
      url= '/proxy/globaldatasources/' + datasource.metadata.name 
  ```

## API definition

### `Datasource`

#### Get a list of `Datasource`

```bash
GET /api/v1/projects/<project_name>/datasources
```

URL query parameters:

- kind = `<string>` : should be used to filter the list of datasources with a specific kind
- default = `<boolean>` : should be used to filter the list of datasources to only have the default one. You should have
  one default datasource per kind
- name = `<string>` : should be used to filter the list of datasources based on the prefix name.

Example:

The following query should return an empty list or a list containing a single Prometheus datasource.

```bash
GET /api/v1/projects/<project_name>/datasources?kind=Prometheus&default=true
```

#### Get a single `Datasource`

```bash
GET /api/v1/projects/<project_name>/datasources/<datasource_name>
```

#### Create a single `Datasource`

```bash
POST /api/v1/projects/<project_name>/datasources
```

#### Update a single `Datasource`

```bash
PUT /api/v1/projects/<project_name>/datasources/<datasource_name>
```

#### Delete a single `Datasource`

```bash
DELETE /api/v1/projects/<project_name>/datasources/<datasource_name>
```

### `GlobalDatasource`

#### Get a list of `GlobalDatasource`

```bash
GET /api/v1/globaldatasources
```

URL query parameters:

- kind = `<string>` : should be used to filter the list of datasource with a specific kind
- default = `<boolean>` : should be used to filter the list of datasource to only have the default one. You should have
  one default datasource per kind
- name = `<string>` : should be used to filter the list of datasource based on the prefix name.

Example:

The following query should return an empty list or a list containing a single Prometheus datasource.

```bash
GET /api/v1/globaldatasources?kind=Prometheus&default=true
```

#### Get a single `GlobalDatasource`

```bash
GET /api/v1/globaldatasources/<name>
```

#### Create a single `GlobalDatasource`

```bash
POST /api/v1/globaldatasources
```

#### Update a single `GlobalDatasource`

```bash
PUT /api/v1/globaldatasources/<name>
```

#### Delete a single `GlobalDatasource`

```bash
DELETE /api/v1/globaldatasources/<name>
```
