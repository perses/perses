# Prometheus Datasource Builder

## Constructor

```golang
import promDs "github.com/perses/perses/go-sdk/prometheus/datasource"

var options []promDs.Option
promDs.Prometheus(options...)
```
Need a list of options. At least direct URL or proxy URL, in order to work.

## Default options

- None


## Available options

#### Direct URL
```golang
import promDs "github.com/perses/perses/go-sdk/prometheus/datasource"

promDs.DirectURL("https://prometheus.demo.do.prometheus.io")
```
Set Prometheus plugin for the datasource with a direct URL.


#### Proxy
```golang
import promDs "github.com/perses/perses/go-sdk/prometheus/datasource"

promDs.HTTPProxy("https://current-domain-name.io", httpProxyOptions...)
```
Set Prometheus plugin for the datasource with a proxy URL, useful for bypassing. More info at [HTTP Proxy](../helper/http-proxy.md).




