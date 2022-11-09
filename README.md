Perses
======
[![build](https://github.com/perses/perses/workflows/build_and_release/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Abuild)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/react/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3React)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)

## Overview

Perses is part of the [CoreDash community](https://github.com/coredashio/community). It belongs to the Linux Foundation.
At a later stage, we want to promote the project to the [Cloud Native Computing Foundation](https://www.cncf.io/) and be
part of the monitoring tools like Prometheus or Thanos.

Perses is going to tackle multiple different goals:

1. It aims to become a **standard** dashboard visualization tool for Prometheus and other datasources. It will focus on
   being GitOps-compatible and thus enabling a smooth "dashboards as code" workflow via a new and well-defined dashboard
   definition model.
2. While becoming another visualization tool, Perses also aims to provide different npm packages, so it can benefit to
   anyone that would like to embed charts and dashboards in their UI. For example, these packages might be used to
   improve the display of the data in the Prometheus UI.
3. It also aims to offer a Kubernetes-native mode in which dashboard definitions can be deployed into and read from
   individual application namespaces (Using CRDs). For more information you can take a look
   at [the doc](./docs/kubernetes.md) that would give you an idea of how it would work.
4. To be friendly to dashboard as code users, we want to provide a complete static validation of the dashboard format.
   That means you will be able to validate your dashboard in a CI/CD using the Perses CLI (named `percli`)
5. The architecture should support plugins (at least for the panels)

## Status

While we already released a certain amount of versions, Perses is still in an early alpha stage and still work in
progress. The current pieces that are in place are:

* The Plugin architecture has finally reached a stable point.
    * The plugins concerned the Variables, the Panels, The Queries and the Datasources definitions.
    * To provide a good static validation, the backend is using multiple Cue schemas and the CLI has the `lint` command.
      All schemas are available in the [schemas](./schemas) folder.
* A backend REST API provides R/W access to dashboard and datasource definitions.
* While the UI is still in progress, we already have:
    * a beginning of navigation that will help to move from a dashboard to another.
    * a support of the following panel types:
        * Time series charts.
        * Gauge panels.
        * Stat panels (single value with sparkline).
        * Markdown panels (as an alternative to the Text panel)
    * The editing of dashboard is well advanced. Most of the remaining work is in panel options, right now you have to
      use the JSON editor for a lot of properties, but those will be form controls soon.
* A migration script that will help to move from Grafana to Perses is on going.
* The dashboard data model is still evolving along with the dashboard implementation and new requirements. Before
  reaching a stable state regarding the data model, we are waiting for feedback to know if we need to adjust and
  potentially break things.

## What's next

Here is a not ordered list of what it can come in the future in Perses:

* Perses native on Kubernetes using CRDs
* Traces Visualization support
* Docs, a lot of docs :)
* Generating Panel #200
* Sub folder management #183
* Datasource discovery #74

## Install

There are various ways of installing Perses.

### Precompiled binaries

Precompiled binaries for released versions are available in
the [GitHub release](https://github.com/perses/perses/releases). Using the latest release binary is the recommended way
of installing Perses.

### Docker images

Docker images are available on [Docker Hub](https://hub.docker.com/r/persesdev/perses).

You can launch a Perses container for trying it out with:

```bash
docker run --name perses -d -p 127.0.0.1:8080:8080 persesdev/perses
```

Note: The config file included in the docker image doesn't have the right format and so the binary is crashing, yelling at this config.
This is already adressed in a PR. While waiting for the next release, you will need to override the config file included in the docker image to see it working.

### Building from source

To build Perses from source code, You need:

* Go [version 1.18 or greater](https://golang.org/doc/install).
* NodeJS [version 16 or greater](https://nodejs.org/).
* npm [version 8 or greater](https://www.npmjs.com/).

Start by cloning the repository:

```bash
git clone https://github.com/perses/perses.git
cd perses
```

Then you can use `make build` that would build the web assets and then Perses itself (and also the Perses CLI that can
be used to interact directly with the Perses API in case you prefer to browser the API using a terminal).

```bash
make build
./bin/perses --config=your_config.yml
```

## Contributing and development

General instructions about how you can contribute to Perses are available in the
document [CONTRIBUTING.md](CONTRIBUTING.md).

In case you are more interested into the React UI development, please refer to [UI Readme](./ui/README.md). It will give
you instruction about how to build, run or test the React UI. It will also some insight about how it is designed.

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
