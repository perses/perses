# OpenGemini Plugin for Perses

This plugin provides OpenGemini datasource and time series query support for [Perses](https://github.com/perses/perses).

## Overview

[OpenGemini](https://github.com/openGemini/openGemini) is a CNCF sandbox project - an open-source distributed time-series database with high concurrency, high performance, and high scalability. It is fully compatible with InfluxDB v1.x Line Protocol, InfluxQL, and read/write APIs.

## Plugins Included

### OpenGeminiDatasource

A datasource plugin for connecting to OpenGemini instances. Supports:

- Direct URL connection
- HTTP Proxy configuration

### OpenGeminiTimeSeriesQuery

A time series query plugin that uses InfluxQL to query data from OpenGemini. Features:

- InfluxQL query support
- Database selection
- Variable substitution

## Installation

1. Build the plugin:

   ```bash
   cd plugins/opengemini
   npm install
   npm run build
   ```

2. Copy the built plugin to your Perses plugins directory.

3. Restart Perses to load the plugin.

## Usage

### Creating a Datasource

1. Go to Admin > Global Datasources or Project > Datasources
2. Click "Add Datasource"
3. Select "OpenGeminiDatasource"
4. Configure the URL to your OpenGemini instance (default port: 8086)

### Creating Queries

1. Create or edit a dashboard panel
2. Select "OpenGeminiTimeSeriesQuery" as the query type
3. Enter your database name
4. Write your InfluxQL query

Example query:

```sql
SELECT mean("value") FROM "cpu" WHERE time > now() - 1h GROUP BY time(1m), "host"
```

## License

Apache License 2.0
