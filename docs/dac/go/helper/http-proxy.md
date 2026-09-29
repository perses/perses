# HTTP Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/http"

var options []http.Option
http.New("http://mysuperurl.com", options...)
```

Need to provide an url and a list of options.

## Default options

- URL(): with the url provided in the constructor

## Available options

### URL

```golang
import "github.com/perses/perses/go-sdk/http" 

http.URL("http://mysuperurl.com")
```

Define the url of the http proxy.

### Timeout

```golang
import "github.com/perses/perses/go-sdk/http"

http.Timeout("10s")
```

Define the maximum amount of time allowed to establish a connection to the datasource. It must be greater than zero.
When not set, the default timeout of the Perses server is used.
Note that the Perses server rejects a timeout greater than the maximum it allows (`datasource.http_proxy.max_timeout`).

### AllowedEndpoints

```golang
import "github.com/perses/perses/go-sdk/http" 

var endpoints []http.AllowedEndpoint
http.AllowedEndpoints(endpoints...)
```

Define the proxy allowed endpoints.

### AddAllowedEndpoint

```golang
import "github.com/perses/perses/go-sdk/http"

http.AddAllowedEndpoint("GET", "/api/v1/labels")
```

Add an allowed endpoint to the http proxy.

### Headers

```golang
import "github.com/perses/perses/go-sdk/http" 

headers := make(map[string]string)
http.Headers(headers)
```

Define the headers of the http proxy.

### AddHeader

```golang
import "github.com/perses/perses/go-sdk/http" 

http.AddHeader("Authorization", "Bearer test")
```

Add a header to the http proxy.

### Secret

```golang
import "github.com/perses/perses/go-sdk/http" 

http.Secret("secretName")
```

Define the secret name to use for the http proxy.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/http"
	
	promDs "github.com/perses/plugins/prometheus/sdk/go/datasource"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddDatasource("prometheusDemo", promDs.Prometheus(
			promDs.HTTPProxy("https://prometheus.demo.do.prometheus.io/", http.AddHeader("Authorization", "Bearer test")), 
        )),
	)
}
```
