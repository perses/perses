# TLS and plain HTTP datasource

When you run Perses using TLS and your time series backend with Prometheus is just plain HTTP you can configure the data source with the "HTTP Settings: Direct access".
Saving the data source is indicated successfully.
When you try now to create some dashboards you will see a "Load failed" error message without further indication of what the real problem is.

![Screenshot from the Perses datasource configuration screen](https://github.com/user-attachments/assets/4b89d15f-81f0-497b-a25a-e02103b4f9f6 "Perses datasources configuration")

## Diagnostics

When you use the browser inspector and look at the JavaScript console output you will find the error message: "Fetch API cannot load http://:9009/prometheus/api/v1/guery_range due to access control checks."

![Screenshot from the fetch API error message using a HTTP datasource](https://github.com/user-attachments/assets/27b745f4-dccc-4112-bf2d-6b88cf23d0a1 "Fetch API error message")

## Solution

If you have a requirement to run Perses and Prometheus in a mixed HTTPS/HTTP mode you need to configure Perses as a Proxy for the fetch queries.

![Screenshot from the Perses datasource using proxy access](https://github.com/user-attachments/assets/e25d2233-3e48-4bce-837b-b60257809c59 "Proxy access configuration")
