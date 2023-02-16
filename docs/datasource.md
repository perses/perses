# Datasource Specification

This documentation is describing how a datasource can be defined and can be used in a dashboard. It is the conclusion of
the discussion #404.

## How datasource can be defined

We will have three different ways to define a datasource, depending on the scope we want to give
to the datasource.

### Dashboard level

Like in the first draft, we can extend the dashboard spec to include a list of datasources:

```typescript
interface DashboardSpec {
    // ... existing dashboard spec ...
    datasources: Record<string, DatasourceSpec>;
}
```

Of course the scope of such definition is the dashboard where it is defined. It cannot be used outside of the dashboard.

**Note**: We don’t really have a use case in mind, but as it is not really complicated to have it in the dashboard
specification, we decided to support it.
Once we will have user feedbacks, if they don’t like it, it won’t be that hard to remove as well.

### Project level

In case you would like to share a datasource across different dashboards in the **same** project, you will need to
create
an object called Datasource.

```typescript
interface Datasource {
    kind: "Datasource";
    metadata: ProjectMetadata;
    spec: DatasourceSpec;
}
```

#### API definition

##### Get a list of datasources

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

##### Get a single datasource

```bash
GET /api/v1/projects/<project_name>/datasources/<datasource_name>
```

##### Create a single datasource

```bash
POST /api/v1/projects/<project_name>/datasources
```

##### Update a single datasource

```bash
PUT /api/v1/projects/<project_name>/datasources/<datasource_name>
```

##### Delete a single datasource

```bash
DELETE /api/v1/projects/<project_name>/datasources/<datasource_name>
```

### Global level

When we talk about scope and user permission in a REST API, the easiest way is to associate one permission per endpoint.
If we want to provide a datasource shared by all projects, then it makes sense to create a different object that is
living outside a project.

That’s why we will have a new resource called `GlobalDatasource`

```typescript
interface GlobalDatasource {
    kind: "GlobalDatasource";
    metadata: Metadata;
    spec: DatasourceSpec;
}
```

Note that the `metadata` is not the same type as in the resource `Datasource`.

#### API definition

##### Get a list of global datasources

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

##### Get a single datasource

```bash
GET /api/v1/globaldatasources/<name>
```

##### Create a single datasource

```bash
POST /api/v1/globaldatasources
```

##### Update a single datasource

```bash
PUT /api/v1/globaldatasources/<name>
```

##### Delete a single datasource

```bash
DELETE /api/v1/globaldatasources/<name>
```

### Reason why we don't provide a single object containing a list of datasource

We are wishing to provide a REST API that exposes a way to manage the datasources per project and globally. When we talk
about REST API, it means for every resource provided it comes with the same (at least) 5 different endpoints:

* `GET /<plural resource like dashboardS>` : to be used to return a list of this resource
* `GET /<plural resource>/<resource_name>` : to be used to return a unique resource
* `POST /<plural resource>` : to be used to create a new resource
* `PUT /<plural resource>/<resource_name>` : to be used to update a resource
* `DELETE /<plural resource>/<resource_name>` : to be used to delete a resource

1. If we provide an object like proposed in the first draft

```typescript
// At the Project level
interface ProjectConfigSpec {
    datasources: Record<string, DatasourceDefinition>;
    defaultDatasources: Array<KeyDatasourceSelector>;
}
```

then with the first endpoint that is returning a list of resources, we would have a list of map of datasources.
Not a good thing in this context.

It is understandable using a map will make the research easier, the filtering etc, and that's totally something that can
be considered. We can add more query parameters to the first endpoint, so we could filter the datasources per kind for
example (like it is proposed above)

2. Providing these endpoints for each resource supported helps to maintain a clean code in the backend as the code won't
   really make a difference between handling a datasource or a dashboard. The endpoints will be similar, so the code can
   be a bit more generic.

3. We want to install Perses natively on Kubernetes using CRDs (Custom Resource Documents). Kubernetes will
   automatically expose the different endpoints described above, so we have to respect these standards to be sure we
   won't have any weird behavior when installing Perses on Kubernetes.

## Struct of DatasourceSpec

Like the Panels, we have a common base shared by every kind of datasource:

```typescript
interface DatasourcePlugin {
    kind: string;
    spec: any;
}

interface DatasourceSpec {
    kind: string; // Like 'Prometheus'
    display?: { // Totally optional
        name: string
        description?: string
    };
    default: boolean // if true, then it's the default datasource
    plugin: DatasourcePlugin // here you will have the specific configuration of the datasource itself
}
```

### Prometheus Datasource

Prometheus as a datasource is basically an HTTP server, so we will likely just have an HTTP config

```typescript

interface commonProxySpec {
    // secret is the name of the secret that should be used for the proxy or discovery configuration
    // It will contain any sensitive information such as password, token, certificate.
    secret?: string;
    // discovery will contain a discovery configuration. For example this is where you will have the k8s discovery.
    // IMPORTANT: This is not yet specified how the discovery configuration will look like. It will be decided and implemented later. 
    discovery?: any;
}

interface HTTPProxySpec extends commonProxySpec {
    // url is the url of datasource. It is not the url of the proxy.
    // Once the discovery configuration is available, url won't be mandatory anymore.
    url: string;
    // allowed_endpoints is a list of tuples of http methods and http endpoints that will be accessible.
    // Leave it empty if you don't want to restrict the access to the datasource.
    allowed_endpoints?: {
        endpoint_pattern: RegExp;
        method: 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE'
    }[];
    // headers can be used to provide additional headers that need to be forwarded when requesting the datasource
    headers?: Record<string, string>
}

interface HTTPProxy {
    kind: "HTTP";
    spec: HTTPProxySpec;
}

interface PrometheusDatasourceSpec {
    // direct_url is the url of the datasource.
    // Leave it empty if you don't want to access the datasource directly from the UI.
    // Use proxy, if you want to access the datasource through the Perses' server.
    direct_url?: string;
    // proxy is the http configuration that will be used by the Perses' server to redirect to the datasource any query sent by the UI. 
    proxy?: HTTPProxy;
}
```

A simple Prometheus datasource would be

```json
{
  "kind": "Datasource",
  "metadata": {
    "name": "PrometheusDemo",
    "project": "perses"
  },
  "spec": {
    "default": true,
    "plugin": {
      "kind": "Prometheus",
      "spec": {
        "direct_url": "https://prometheus.demo.do.prometheus.io"
      }
    }
  }
}
```

A more complex one:

```json
{
  "kind": "Datasource",
  "metadata": {
    "name": "PrometheusDemo",
    "project": "perses"
  },
  "spec": {
    "default": true,
    "plugin": {
      "kind": "Prometheus",
      "spec": {
        "proxy": {
          "kind": "HTTP",
          "spec": {
            "url": "https://prometheus.demo.do.prometheus.io",
            "allowed_endpoints": [
              {
                "endpoint_pattern": "/api/v1/labels",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/series",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/metadata",
                "method": "GET"
              },
              {
                "endpoint_pattern": "/api/v1/query",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/query_range",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/label/([a-zA-Z0-9_-]+)/values",
                "method": "GET"
              }
            ],
            "secret": "prometheus_secret_config"
          }
        }}
      
    }
  }
}
```

#### How an SQL datasource could look like

This is just an example what an SQL datasource could look like. This is just to be sure our datasource model can scale.

```typescript
interface SQLDatasourceSpec {
    proxy: SQLProxy;
}

interface SQLProxySpec extends commonProxySpec {
    url: string
}

interface SQLProxy {
    kind: "SQL";
    spec: SQLProxySpec;
}
```

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

So if by any chance you a local datasource that is named exactly like a Project datasource, or a Global datasource, we
will consider that the user intentionally wanted to override the upper datasource, so we will use the one with the
smallest scope.

In case we have feedback that ask explicitly to have a way to select precisely what datasource to be used, we will add
another field in the selector like `level` which will indicate at what level the datasource should be retrieved.

> TODO/TO BE DISCUSSED: Selector is at panel level or at query level ?

> TODO/TO BE DISCUSSED: It could be interesting to integrate immediately the field `level` to cover the following
> scenario:
> 1. You created a dashboard where you are selecting a Global Datasource called "Foo".
> 2. After that, someone is creating a new datasource called "Foo" in the same project as the previous dashboard.
>
>    > As a result, the scope of the datasource selected change without modifying the dashboard. It can be a good or a
>    > bad thing. Somehow I have a feeling it's more a bad thing that a good one.

### How to use the Perses' proxy

As described before, you can provide a proxy configuration that will be used by the Perses server to redirect any
queries to the datasource.

It means in case of the Prometheus datasource, if the field `direct_url` is not set, then the FE needs to use the Perses
server to contact the datasource. For that the FE will have to determinate which URL should be used to contact the
Perses server based on what kind of datasource is used.

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
