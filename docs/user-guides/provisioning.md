# Provisioning

The provisioning feature allows to inject any kind of resources in the database when Perses is starting.

That can be useful in case you would like to populate your database with a set of predefined datasources for example.

To ensure these data are not removed at the runtime, the provisioning is re-injecting them at a configured frequency (by
default 1 hour).

If you want to activate this feature, you need to complete your configuration file with the following section:

```yaml
provisioning:
  folders:
    - /folder/foo/bar
    - /another/folder
```

You can add any folder you would like. Perses will ignore any files not managed and will loop recursively through any
subfolders contained in the folders configured.
