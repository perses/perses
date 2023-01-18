# Configuration

## Flags available

```bash
  -config string
        Path to the yaml configuration file for the api. Configuration can be overridden when using the environment variable
  -db.extension string
        The extension of the file to read and use when creating a file. yaml or json are the only value accepted (default "yaml")
  -db.folder string
        Path to the folder that would be used as a database. In case the flag is not used, Perses required to have a connection to ETCD
  -log.level string
        log level. Possible value: panic, fatal, error, warning, info, debug, trace (default "info")
  -log.method-trace
        include the calling method as a field in the log. Can be useful to see immediately where the log comes from
  -web.hide-port
        If true, it won t be print on stdout the port listened to receive the HTTP request
  -web.listen-address string
        The address to listen on for HTTP requests, web interface and telemetry. (default ":8080")
  -web.telemetry-path string
        Path under which to expose metrics. (default "/metrics")
```

Example:

```bash
perses --config=./config.yaml --log.method-trace
```

### Configuration File

This service can be configured using a yaml file or the environment variable.

Note: you can use both, environment variable will override the yaml configuration.

```yaml
database:
  file: # the configuration when you want to use the filesystem as a database. Note that you can configure it using the flags, which gives you the choice to not create a configuration file just for that.
    folder: "/path/to/the/database/storage" # It's the path where the file will be read/ stored
    file_extension: "yaml" # The extension of the files read / stored. "yaml" or "json" are the only extension accepted. Yaml is the default one
  etcd: # the etcd configuration. If you choose the file configuration, this one should be kept empty
    connections: # the list of the nodes that are part of a single etcd cluster
      - host: "etcd.node1" #the host name of the etcd connection
        port: 2379 # the port of the etcd connection. By default it's 2379
    protocol: "http" # http or https
    user: "usr" # the user to use for the connections 
    password: "pwd" # the password to use for the connections
    request_timeout: 120 #"the time in second allowed before a request to etcd timeout. By default it's 120"
```

Note: to have the corresponding environment variable you just have to contact all previous key in the yaml and put it in
uppercase. Every environment variable for this config are prefixed by `PERSES`

For example, the environment variable for the password for etcd would be:

```
PERSES_DATABASE_ETCD_PASSWORD
```

When you are dealing with the array, just include the index number in the variable. For example:

```
PERSES_DATABASE_ETCD_CONNECTIONS_0_HOST="etcd.node1"
PERSES_DATABASE_ETCD_CONNECTIONS_0_PORT= "7895"
PERSES_DATABASE_ETCD_CONNECTIONS_1="etcd.node2"
```
