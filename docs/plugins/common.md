# Common definitions

Standard definitions that plugins can use.

## Calculation specification

Calculation is defined as:

```yaml
<enum = "first" | "last" | "first-number" | "last-number" | "mean" | "sum" | "min" | "max"> # "last" is the default
```

## Format specification

The format spec is defined as:

```yaml
<anyOf = Time format | Percent format | Decimal format | Bytes format | Throughput format | Currency Format>
```

### Time format

```yaml
unit: <enum = "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years">
decimalPlaces: <int> # Optional
```

### Percent format

```yaml
unit: <enum =  "percent" | "percent-decimal">
decimalPlaces: <int> # Optional
```

### Decimal format

```yaml
unit: "decimal"
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Bits format

```yaml
unit: < enum = "bits" | "decbits" >
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Bytes format

```yaml
unit: < enum = "bytes" | "decbytes" >
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Throughput format

```yaml
unit: < enum = "counts/sec" | "events/sec" | "messages/sec" | "ops/sec" | "packets/sec" | "reads/sec" | "records/sec" | "requests/sec" | "rows/sec" | "writes/sec">
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Currency format

```yaml
unit: < enum = "aud" | "cad" | "chf" | "cny" | "eur" | "gbp" | "hkd" | "inr" | "jpy" | "krw" | "nok" | "nzd" | "usd" | "sek" | "sgd" >
decimalPlaces: <int> # Optional
```

## Legend specification

```yaml
position: <enum = "bottom" | "right">
mode: <enum = "list" | "table"> # Optional
size: <enum = "small" | "medium"> # Optional
```

## Legend-with-values specification

```yaml
<Legend specification>
values:
  - <Calculation specification> # Optional
```

## Mapping specification

```yaml
<anyOf = Value condition | Range condition | Regex condition | Misc condition>
```

### Value condition

```yaml
kind: "Value"
spec:
  value: <string>
  result: <Mapping result>
```

### Range condition

```yaml
kind: "Range"
spec:
  from?: <number>
  to?: <number>
  result: <Mapping result>
```

### Regex condition

```yaml
kind: "Regex"
spec:
  pattern: <string>
  result: <Mapping result>
```

### Misc condition

```yaml
kind: "Misc"
spec:
  value: <enum = "empty" | "null" | "NaN" | "true" | "false">
  result: <Mapping result>
```

### Mapping result

```yaml
value: <string>
color: <string> # Optional
```

## Proxy specification

### HTTP Proxy specification

```yaml
kind: "HTTPProxy"
spec:
  # URL is the url of datasource. It is not the url of the proxy.
  url: <url>

  # The maximum amount of time allowed to establish a connection to the datasource.
  # When not set or set to 0, the default timeout of the server is used (datasource.http_proxy.default_timeout).
  # It cannot be greater than the maximum timeout allowed by the server (datasource.http_proxy.max_timeout).
  timeout: <duration> # Optional

  # It is a tuple list of http methods and http endpoints that will be accessible.
  # Leave it empty if you don't want to restrict the access to the datasource.
  allowedEndpoints:
    - <Allowed Endpoints specification> # Optional

  # It can be used to provide additional headers that need to be forwarded when requesting the datasource
  headers:
    <string>: <string> # Optional

  # This is the name of the secret that should be used for the proxy or discovery configuration
  # It will contain any sensitive information such as password, token, certificate.
  # Please read the documentation about secrets to understand how to create one
  secret: <string> # Optional
```

#### Allowed Endpoints specification

```yaml
endpointPattern: <RegExp>
method: <enum | possibleValue = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE'>
```

### SQL Proxy specification

```yaml
kind: "SQLProxy"
spec:
  # Driver is the SQL driver for the datasource
  driver: <enum | possibleValue = 'mysql' | 'mariadb' | 'postgres'>
  
  # Host is the hostname:port of datasource. It is not the hostname of the proxy.
  host: <string>
  
  # Database name of database for the datasource.
  database: <string>
  
  # This is the name of the secret that should be used for the proxy or discovery configuration
  # It will contain any sensitive information such as password, token, certificate.
  # Please read the documentation about secrets to understand how to create one
  secret: <string> # Optional
  
  # MySQL specific driver config
  mysql:
    # params Connection parameters. They are interpreted like the parameters of a DSN of the Go MySQL driver,
    # so they can be options of the driver (e.g. parseTime, tls) or system variables.
    # When the secret doesn't define a TLS config, TLS is required, and the certificate of the server is verified with the system CAs.
    # Set the param "tls" to "false" to disable TLS, or to "preferred" to use TLS without verifying the certificate when the server supports it.
    # Note: the params "multiStatements", "allowAllFiles", "allowCleartextPasswords" and "allowOldPasswords" are always disabled.
    # In particular, the authentication methods requiring the password in clear text (mysql_clear_password, e.g. PAM or LDAP) are not supported.
    params: 
      <string>: <string> # Optional
      
    # maxAllowedPacket Max packet size allowed
    maxAllowedPacket: <int> # Optional 
    
    # timeout Dial timeout 
    timeout: <duration> # Optional 
    
    # readTimeout I/O read timeout
    readTimeout: <duration> # Optional 
    
    # writeTimeout I/O write timeout
    writeTimeout: <duration> # Optional 

  # MariaDB specific driver config (uses same structure as MySQL since MariaDB is MySQL-compatible)
  mariadb:
    # params Connection parameters. See the MySQL params above.
    params: 
      <string>: <string> # Optional
      
    # maxAllowedPacket Max packet size allowed
    maxAllowedPacket: <int> # Optional 
    
    # timeout Dial timeout 
    timeout: <duration> # Optional 
    
    # readTimeout I/O read timeout
    readTimeout: <duration> # Optional 
    
    # writeTimeout I/O write timeout
    writeTimeout: <duration> # Optional 

  # Postgres specific driver config
  postgres:
    # specifies command-line options to send to the server at connection start
    options: <string>
    
    # the max connections for the SQL connection
    maxConns: <int> # Optional 
    
    # the timeout value used for socket connect operations. It is rounded up to the second.
    connectTimeout: <duration> # Optional

    # Not supported: it is an option of the PostgreSQL JDBC driver, and it is ignored.
    prepareThreshold: <int> # Optional

    # The ssl configuration when connection to the datasource. It follows the semantic of libpq, and defaults to 'prefer'.
    # When the secret defines a TLS config, it is used to establish the TLS connection and to verify the certificate of the server,
    # and the sslMode must be set to a mode using TLS ('allow', 'prefer', 'require', 'verify-ca' or 'verify-full').
    # If the TLS config doesn't define the server name, the host is used.
    # Unlike libpq, the certificate of the server is then always verified with the TLS config, including its hostname, whatever the sslMode:
    # 'require' and 'verify-ca' behave like 'verify-full', unless the TLS config sets insecureSkipVerify.
    sslMode: <enum | possibleValue = 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full'> # Optional
```

## Thresholds specification

```yaml
mode: <enum = "percent" | "absolute"> # Optional
defaultColor: <string> # Optional
steps:
  - <Step specification> # Optional
```

### Step specification

```yaml
value: <int>
color: <string> # Optional
name: <string> # Optional
```

## Transform specification

```yaml
<anyOf = Join-by-column-value transform | Merge-columns transform | Merge-indexed-columns transform | Merge-series transform>
```

### Join-by-column-value transform

```yaml
kind: "JoinByColumnValue"
spec:
  columns: [string]
  disabled?: bool
```

### Merge-columns transform

```yaml
kind: "MergeColumns"
spec:
  columns: [string]
  name: <string>
  disabled: bool # Optional
```

### Merge-indexed-columns transform

```yaml
kind: "MergeIndexedColumns"
spec:
  column: <string>
  disabled: bool # Optional
```

### Merge-series transform

```yaml
kind: "MergeSeries"
spec:
  disabled: bool # Optional
```

### Merge-series transform

```yaml
kind: "MergeSeries"
spec:
  disabled: bool # Optional
```
