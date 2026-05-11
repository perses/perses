# Metrics and Instrumentation

Perses exposes Prometheus metrics to provide observability into its own operation and usage. This includes both standard application metrics and custom dashboard usage metrics.

## Overview

Perses instruments itself with Prometheus metrics that can be scraped and stored by a Prometheus server. These metrics help operators monitor the health and usage of their Perses instance.

## Metrics Endpoint

By default, Perses exposes metrics at the `/metrics` endpoint on the same port as the API server (default: `:8080`).

You can customize the metrics path using the `-web.telemetry-path` flag:

```bash
perses --web.telemetry-path="/custom-metrics"
```

## Dashboard Usage Metrics

Perses provides custom metrics to track dashboard usage, which are particularly valuable for understanding how dashboards are being used and identifying potential issues.

### Available Metrics

#### `perses_dashboard_views_total`

**Type:** Counter

**Description:** Tracks the total number of times a dashboard has been viewed.

**Labels:**
- `project`: The project name containing the dashboard
- `dashboard`: The dashboard name

**Example:**
```promql
# Total views for a specific dashboard
perses_dashboard_views_total{project="myproject", dashboard="mydashboard"}

# Rate of dashboard views over the last 5 minutes
rate(perses_dashboard_views_total[5m])

# Top 10 most viewed dashboards
topk(10, sum by (project, dashboard) (perses_dashboard_views_total))
```

**Use Cases:**
- Identify the most popular dashboards
- Track dashboard adoption over time
- Determine when a dashboard was last viewed (by checking when the counter last increased)

#### `perses_dashboard_render_errors_total`

**Type:** Counter

**Description:** Tracks the total number of render errors that occurred when loading panels on a dashboard.

**Labels:**
- `project`: The project name containing the dashboard
- `dashboard`: The dashboard name

**Example:**
```promql
# Total render errors for a specific dashboard
perses_dashboard_render_errors_total{project="myproject", dashboard="mydashboard"}

# Dashboards with render errors in the last hour
increase(perses_dashboard_render_errors_total[1h]) > 0

# Error rate per dashboard
rate(perses_dashboard_render_errors_total[5m])
```

**Use Cases:**
- Identify dashboards with configuration issues
- Monitor dashboard health
- Alert on dashboards that are failing to render properly

#### `perses_dashboard_render_time_seconds`

**Type:** Histogram

**Description:** Tracks the time taken to render a dashboard in the frontend.

**Labels:**
- `project`: The project name containing the dashboard
- `dashboard`: The dashboard name

**Buckets:** Uses Prometheus default buckets (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10)

**Example:**
```promql
# Average render time for a dashboard
rate(perses_dashboard_render_time_seconds_sum{project="myproject", dashboard="mydashboard"}[5m])
/
rate(perses_dashboard_render_time_seconds_count{project="myproject", dashboard="mydashboard"}[5m])

# 95th percentile render time across all dashboards
histogram_quantile(0.95, sum(rate(perses_dashboard_render_time_seconds_bucket[5m])) by (le))

# Dashboards with slow render times (>5 seconds)
histogram_quantile(0.95, sum by (project, dashboard, le) (rate(perses_dashboard_render_time_seconds_bucket[5m]))) > 5
```

**Use Cases:**
- Identify slow-loading dashboards
- Monitor dashboard performance over time
- Optimize dashboard configurations based on render times

## How Usage Tracking Works

When a user views a dashboard in the Perses UI:

1. The frontend loads the dashboard definition from the API
2. The frontend renders all panels in the dashboard
3. Once rendering is complete, the frontend sends a POST request to `/api/v1/visit` with:
   - Project and dashboard identifiers
   - Render time in seconds
   - Number of panel errors encountered
4. The backend updates the corresponding Prometheus metrics
5. These metrics are exposed at the `/metrics` endpoint for scraping

### API Endpoint

**Endpoint:** `POST /api/v1/visit`

**Request Body:**
```json
{
  "project": "myproject",
  "dashboard": "mydashboard",
  "render_time": 1.234,
  "render_errors": 0
}
```

**Authentication:** Requires read permission on the dashboard (same as viewing the dashboard)

## Configuring Prometheus to Scrape Perses

To collect these metrics, configure Prometheus to scrape your Perses instance:

```yaml
scrape_configs:
  - job_name: 'perses'
    static_configs:
      - targets: ['perses:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

For Kubernetes deployments, you can use service discovery:

```yaml
scrape_configs:
  - job_name: 'perses'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - perses
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: perses
      - source_labels: [__meta_kubernetes_pod_container_port_name]
        action: keep
        regex: http
```

## Example Dashboards and Alerts

### Monitoring Dashboard Usage

Create a dashboard in Perses (or Grafana) to monitor your Perses instance:

**Most Viewed Dashboards (Last 24h):**
```promql
topk(10, increase(perses_dashboard_views_total[24h]))
```

**Dashboards with Errors:**
```promql
sum by (project, dashboard) (increase(perses_dashboard_render_errors_total[1h])) > 0
```

**Slowest Dashboards (95th percentile):**
```promql
topk(10,
  histogram_quantile(0.95,
    sum by (project, dashboard, le) (
      rate(perses_dashboard_render_time_seconds_bucket[5m])
    )
  )
)
```

### Alerting Rules

Example Prometheus alerting rules:

```yaml
groups:
  - name: perses_dashboard_health
    interval: 5m
    rules:
      - alert: DashboardRenderErrors
        expr: |
          increase(perses_dashboard_render_errors_total[15m]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Dashboard {{ $labels.dashboard }} in project {{ $labels.project }} has render errors"
          description: "Dashboard has experienced {{ $value }} render errors in the last 15 minutes"

      - alert: DashboardSlowRender
        expr: |
          histogram_quantile(0.95,
            sum by (project, dashboard, le) (
              rate(perses_dashboard_render_time_seconds_bucket[5m])
            )
          ) > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Dashboard {{ $labels.dashboard }} in project {{ $labels.project }} is slow to render"
          description: "95th percentile render time is {{ $value }}s (threshold: 10s)"

      - alert: DashboardNotViewed
        expr: |
          time() - (perses_dashboard_views_total > 0) > 604800
        labels:
          severity: info
        annotations:
          summary: "Dashboard {{ $labels.dashboard }} in project {{ $labels.project }} hasn't been viewed in 7 days"
          description: "Consider archiving or removing unused dashboards"
```

## Standard Application Metrics

In addition to dashboard usage metrics, Perses also exposes standard Go application metrics:

- `go_*`: Go runtime metrics (goroutines, memory, GC, etc.)
- `process_*`: Process metrics (CPU, memory, file descriptors, etc.)
- `promhttp_*`: HTTP handler metrics for the metrics endpoint itself

## Privacy and Security Considerations

### Data Collected

The usage metrics collect:
- **Dashboard identifiers**: Project and dashboard names
- **Timing information**: How long dashboards take to render
- **Error counts**: Number of panels that failed to render

The metrics **do not** collect:
- User identities or usernames
- Query parameters or variable values
- Panel content or data
- IP addresses or client information

### Disabling Usage Tracking

Currently, dashboard usage tracking is always enabled when a dashboard is viewed. The metrics are only exposed to authenticated Prometheus scrapers that have access to the `/metrics` endpoint.

If you need to restrict access to metrics:

1. Use network policies or firewall rules to limit access to the metrics endpoint
2. Configure authentication on your Prometheus server
3. Use a reverse proxy to add authentication to the `/metrics` endpoint

### GDPR and Compliance

The dashboard usage metrics are designed to be privacy-friendly:
- No personal data is collected
- Metrics are aggregated and cannot be traced to individual users
- Data retention is controlled by your Prometheus configuration

## Comparison with Grafana

Unlike Grafana, where detailed usage analytics are typically only available in the paid Enterprise edition, Perses provides dashboard usage metrics in the open-source version. This makes it easier for teams to:

- Understand dashboard adoption
- Identify and fix problematic dashboards
- Optimize dashboard performance
- Make data-driven decisions about dashboard management

## Troubleshooting

### Metrics Not Appearing

If you're not seeing dashboard usage metrics:

1. **Verify the dashboard is being viewed**: Metrics are only generated when dashboards are actually loaded in the UI
2. **Check Prometheus scraping**: Ensure Prometheus is successfully scraping the `/metrics` endpoint
3. **Verify permissions**: The user viewing the dashboard must have read permission on it
4. **Check logs**: Look for errors in the Perses server logs related to the `/api/v1/visit` endpoint

### High Cardinality Concerns

Dashboard usage metrics use `project` and `dashboard` labels, which creates one time series per unique dashboard. For large Perses instances with thousands of dashboards:

- Monitor your Prometheus instance for cardinality issues
- Consider using recording rules to pre-aggregate metrics
- Use retention policies to limit historical data

### Inaccurate Render Times

Render time measurements are taken in the browser and may be affected by:
- Client-side performance (CPU, memory)
- Network latency
- Browser tab being in the background
- Browser extensions or ad blockers

These metrics represent the user experience but may not reflect server-side performance.

## Future Enhancements

Potential future improvements to metrics and instrumentation:

- User-level metrics (with opt-in consent)
- Panel-level performance metrics
- Query performance tracking
- API endpoint metrics
- More granular error categorization
- Native histogram support for better percentile calculations

## Related Documentation

- [Configuration](../configuration/configuration.md) - Server configuration options
- [Dashboard](./dashboard.md) - Dashboard concepts and structure
- [Project](./project.md) - Project organization
- [Authorization](./authorization.md) - Permission model
- [Prometheus Documentation](https://prometheus.io/docs/) - Prometheus metrics and querying
