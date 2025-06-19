# Provisioning

The provisioning feature allows to inject any kind of resources in the database when Perses is starting.

This can be useful for instance to populate your database with a set of predefined datasources, projects, etc.

To ensure these data are not removed at runtime, the provisioning is re-injecting them at a configured frequency (by
default 1 hour).

To activate this feature, you need to add the following section to your configuration file:

```yaml
provisioning:
  folders:
    - /folder/foo/bar
    - /another/folder
```

You can add any folder you would like. Perses will ignore any files not managed and will loop recursively through any
sub-folders contained in the folders configured.

To learn more about the data model of the various resources that can be provisioned, please refer to the
[API documentation](../api/README.md).
