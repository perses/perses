<div align="center">

<h1 style="border-bottom: none">
    <a href="https://github.com/perses" target="_blank"><img alt="Perses" src="/docs/images/perses_logo_cropped.svg"></a><br>Perses
</h1>

[![build](https://github.com/perses/perses/workflows/ci/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Aci)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/react/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3AReact)
[![Go Report Card](https://goreportcard.com/badge/github.com/perses/perses)](https://goreportcard.com/report/github.com/perses/perses)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)

</div>

## Overview

Perses is part of the [CoreDash community](https://github.com/coredashio/community). It belongs to the Linux Foundation.
At a later stage, we want to promote the project to the [Cloud Native Computing Foundation](https://www.cncf.io/) and be
part of the monitoring tools like Prometheus or Thanos.

| ![img.png](https://github.com/perses/perses/assets/5657041/3bd8ae57-da7b-4447-9478-cefe19d61a71) | ![img.png](https://github.com/perses/perses/assets/5657041/ba46beab-c8fb-4583-bc2f-71c9893f7906) |
|:------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------:|

Perses aims to tackle multiple goals:

1. Become a **standard** dashboard visualization tool for Prometheus and other datasources. It will focus on being
   GitOps-compatible and thus enabling a smooth Dashboard-as-Code workflow, via a new and well-defined dashboard
   definition model.
2. Provide different npm packages, so that anyone that would like to embed charts and dashboards in their own UI could
   benefit from the work achieved here. For example, these packages might be used in the future to improve the display
   of the data in the Prometheus UI.
3. Offer a Kubernetes-native mode in which dashboard definitions can be deployed into and read from individual
   application namespaces (using CRDs). For more information you can take a look at
   [the doc](./docs/design-docs/kubernetes.md) which would give you an idea of how it would work.
4. To be friendly to Dashboard-as-Code users, by providing a complete static validation of the dashboard format. That
   means you will be able to validate your dashboards in a CI/CD using the Perses CLI (named `percli`)
5. Support plugins, to allow users to extend the capacities natively provided.

## Status

While we already released a certain amount of versions, Perses is still in an early alpha stage and still a work in
progress. The current pieces that are in place are:

- The Plugin architecture has finally reached a stable point.
  - The plugins concern the Variables, Panels, Queries and Datasources definitions.
  - To provide a good static validation, the backend is using multiple CUE schemas and the CLI got a `lint` command.
    All schemas are available in the [cue/schemas](./cue/schemas) folder.
- A backend REST API provides R/W access to dashboard and datasource definitions.
- A CLI that can be used to interact with the REST API. A short doc is available [here](./docs/tooling/cli.md)
- While the UI is still in progress, we already have:
  - a beginning of navigation that will help to move from a dashboard to another.
  - support of the following panel types:
    - Time series charts.
    - Gauge panels.
    - Stat panels (single value with sparkline).
    - Markdown panels (as an alternative to the Text panel)
  - Visual editing of the dashboard is available, which includes a number of editable panel options
- A migration script that helps to move from Grafana to Perses.
- The dashboard data model is still evolving along with the dashboard implementation and new requirements. Before reaching a stable state regarding the data model, we are waiting for feedback to know if we need to adjust and potentially break things.

## What's next

Here is a not ordered list of what it can come in the future in Perses:

- Perses native on Kubernetes using CRDs
- Traces Visualization support
- Docs, a lot of docs :)
- Generating Panel #200
- Sub folder management #183
- Datasource discovery #74

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

### Building from source

To build Perses from source code, You need:

- Go [version 1.18 or greater](https://golang.org/doc/install).
- NodeJS [version 18 or greater](https://nodejs.org/).
- npm [version 8 or greater](https://www.npmjs.com/).

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

### UI development

If you are primarily interested in contributing to the UI application and libraries, please refer to the [UI Readme](./ui/README.md). It includes quick start instructions for how to build, run, and test the React UI. It also includes details about the architecture and [guidelines](./ui/ui-guidelines.md) for development.

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
