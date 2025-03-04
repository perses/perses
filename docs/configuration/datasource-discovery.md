Datasource Discovery
====================

Datasource discovery is a feature that allows you to automatically discover and register datasources in your
application. This feature is useful when you have a large number of datasources, and you don't want to manually register
them in your application.

Note: This feature can only be used when registering Global Datasources.

## HTTP Service Discovery

Perses is able to discover datasources by querying an HTTP service that returns a list of Global Datasources.
The service must reply with:

- an HTTP 200 response
- the HTTP header Content-Type set to application/json
- a body containing a valid array of JSON

Perses will pull the list of datasources from the service at a configured interval. The list of datasources is then
stored in the Perses' database.

This discovery can easily replace the provisioning of datasources in your application in case you would like something
more dynamic.

### Configuration

To enable the HTTP service discovery, you need to add the following configuration to the Perses configuration file:

```yaml
datasource:
  global:
    discovery:
      - name: "my discovery"
        http_sd:
        url: "http://my-service.com/datasources"
```

If you want more details about how to fine-tune the HTTP config (like adding oauth2 authentication), you can check
the [complete configuration documentation](../configuration/configuration.md#httpsd-config).

## Kubernetes Service Discovery

Perses is able to discovery datasource using the Kubernetes API to list the pods or the services. Based on the list of
pods or services found, Perses will generate the associated list of Global Datasources and save it into the database.

This discovery can be useful when you have various Prometheus instances running in your Kubernetes cluster, and you want
to automatically discover them and provide them to your user through Perses.

### Configuration

To enable the Kubernetes service discovery, you need to add the kubeSD config. Here is an example of how to configure it
if you would like to discover the k8s services:

```yaml
datasource:
  global:
    discovery:
    - name: "my discovery"
      kubernetes_sd:
        datasource_plugin_kind: "PrometheusDatasource"
        namespace: "my-namespace"
        service_configuration:
          enable: true
          port_name: "http"
          serviceType: "ClusterIP"
        labels:
          app: prometheus
```

If you want more details about how to fine-tune the Kubernetes config, you can check
the [complete configuration documentation](../configuration/configuration.md#kubernetessd-config).
