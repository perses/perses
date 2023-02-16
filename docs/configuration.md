# Configuration

## Flags available

```bash
  -config string
        Path to the yaml configuration file for the api. Configuration can be overridden when using the environment variable
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
    extension: "yaml" # The extension of the files read / stored. "yaml" or "json" are the only extension accepted. Yaml is the default one
```

Note: to have the corresponding environment variable you just have to contact all previous key in the yaml and put it in
uppercase. Every environment variable for this config are prefixed by `PERSES`

For example, the environment variable corresponding to the file extension of the file DB would be:

```
PERSES_DATABASE_FILE_EXTENSION
```
