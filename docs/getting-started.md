# Getting Started

!!! info
    This guide assumes no prior experience with Perses. For a high-level understanding of the project, see the [Overview](./overview.md).

## Install Perses

Before you begin, you need a running Perses server. Choose the installation method that best fits your environment:

- [Run in a container](./installation/in-a-container.md)
- [Build from source](./installation/from-source.md)
- [Third-party installations](./installation/third-party.md)

You will also need a running Prometheus instance that Perses can connect to. If you are running Perses in a container, make sure both containers share the same network so Perses can reach Prometheus by container name.

## Your First Dashboard

In this section you will create a [project](./concepts/project.md), configure a [datasource](./concepts/datasource.md), and build your first [dashboard](./concepts/dashboard.md).

### Create a Project

A project is the top-level container for dashboards, datasources, and variables.

1. On the home page, click **+ Create**.
2. Enter a name for your project, for example `my-first-project`.
3. Click **Add** to create the project.

You are taken to the project page with tabs for **Dashboards**, **Variables**, **Datasources**, and **Secrets**.

![project created](images/getting-started/project-created.png)

### Add a Datasource

Before you can visualize data, you need to connect Perses to a datasource.

1. Navigate to the **Datasources** tab in your project.
2. Click **Add Datasource**.
3. Fill in the following fields:
    - **Name**: a name for your datasource, for example `PrometheusDemo`.
    - **Set as default**: toggle on.
    - **Source**: select `Prometheus Datasource`.
    - **HTTP Settings**: select `Proxy`.
    - **URL**: the URL of your Prometheus instance, for example `http://prometheus:9090`.
4. Click **Add** to save.

!!! tip
    Use **Proxy** mode so the Perses server forwards requests to Prometheus on your behalf. This avoids CORS issues that occur with **Direct access** mode when the browser cannot reach Prometheus directly.

![datasource created](images/getting-started/datasource-created.png)

### Create a Dashboard

1. Navigate to the **Dashboards** tab in your project.
2. Click **Add Dashboard**.
3. Enter a name, for example `my-first-dashboard`.
4. Click **Add** to create the dashboard.

You are taken to an empty dashboard in edit mode.

### Add a Panel

1. Click **Add Panel** in the top-right toolbar.
2. Fill in the following fields:
    - **Name**: `HTTP Requests`
    - **Type**: `Time Series Chart`
3. Under **Query**, configure:
    - **Query Type**: `Prometheus Time Series Query`
    - **Prometheus Datasource**: your default datasource is pre-selected.
    - **PromQL Expression**: `up`
4. Click **Run Query** to preview the chart. You should see a time series line showing the `up` metric.
5. Click **Add** to add the panel to your dashboard.
6. Click **Save** in the top-right corner to persist your dashboard.

You now have a working dashboard with a time series panel showing live data from Prometheus.

![first dashboard](images/getting-started/first-dashboard.png)

## Exploring Plugins

Perses is extensible through [plugins](./concepts/plugin.md). Each datasource type and visualization type is implemented as a plugin.

<!-- TODO: Add example of building a more complex dashboard using different panel types and variables -->

## Dashboard as Code

Once you are comfortable creating dashboards through the UI, you can manage them as code for version control and automation. Perses supports Dashboard-as-Code with SDKs for both CUE and Go.

- [Getting started with Dashboard-as-Code](./dac/getting-started.md)
- [Dashboard-as-Code concept](./concepts/dashboard-as-code.md)

<!-- TODO: Add a brief DaC example or walkthrough -->

## Next Steps

- Dive deeper into [Concepts](./concepts/dashboard.md)
- Explore the [CLI](./cli.md)
- Check the [API documentation](./api)
