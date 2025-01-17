<div align="center">

<h1 style="border-bottom: none">
    <a href="https://github.com/perses" target="_blank"><img alt="Perses" src="/docs/images/perses_logo_cropped.svg"></a><br>Perses
</h1>

[![build](https://github.com/perses/perses/workflows/ci/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Aci)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/react/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3AReact)
[![Go Report Card](https://goreportcard.com/badge/github.com/perses/perses)](https://goreportcard.com/report/github.com/perses/perses)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/9410/badge)](https://www.bestpractices.dev/projects/9410)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/perses/perses/badge)](https://securityscorecards.dev/viewer/?uri=github.com/perses/perses)

</div>

## Overview

Perses, a [Cloud Native Computing Foundation](https://cncf.io) sandbox project, is a dashboard tool to visualize observability data from Prometheus/Thanos/Jaeger.

| ![img.png](https://github.com/perses/perses/assets/5657041/3bd8ae57-da7b-4447-9478-cefe19d61a71) | ![img.png](https://github.com/perses/perses/assets/5657041/ba46beab-c8fb-4583-bc2f-71c9893f7906) |
|:------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------:|

Perses aims to tackle multiple goals:

1. Become a **standard** dashboard visualization tool for Prometheus and other datasources. It will focus on being
   GitOps-compatible and thus enabling a smooth Dashboard-as-Code workflow, via a new and well-defined dashboard
   definition model.
2. Provide different npm packages, so that anyone that would like to embed panels and dashboards in their own UI could
   benefit from the work achieved here. For example, these packages might be used in the future to improve the display
   of the data in the Prometheus UI.
3. Offer a Kubernetes-native mode in which dashboard definitions can be deployed into and read from individual
   application namespaces (using CRDs). For more information you can take a look at
   [the doc](./docs/design-docs/kubernetes.md) which would give you an idea of how it would work.
4. To be friendly to Dashboard-as-Code users, by providing a complete static validation of the dashboard format. That
   means you will be able to validate your dashboards in a CI/CD using the Perses CLI (named `percli`)
5. Support plugins, to allow users to extend the capacities natively provided.

## Try it

We are providing an online demo available at **https://demo.perses.dev**.
You can create your own project(s) and dashboard(s) there, no one else will be able to modify them!

## Status

1. Perses as an application can now **be used**.
   * The data model reached a stable point, and we are providing multiple panel types that should cover most of the use cases
     when using Prometheus.
   * Authentication and authorization are available.
2. On the GitOps aspect:
   * We provide a CLI that helps interacting with the API. A short doc is available [here](./docs/cli.md)
   * Two SDKs (in Golang and in Cuelang) are available to code dashboards. See [Dashboard-as-Code](./docs/dac/dashboard-as-code.md) guide.
     Probably these SDKs are going to evolve depending on the feedbacks we might receive. Still it's likely to be about adding more
     util functions rather than breaking things.
3. We are eager to change the current plugin architecture to make it potentially simpler and above all to be able to
   externalize the load and the implementation of a plugin.
   * Changes are more on the frontend side. [cue/schemas](./cue/schemas) are kept in their current shape as there is no
     point to remove the static validation of plugins on the backend side.
   * *Work is in progress*

## What's next

Current Roadmap is available [here](./ROADMAP.md)

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

If you are primarily interested in contributing to the UI application and libraries, please refer to
the [UI Readme](./ui/README.md). It includes quick start instructions for how to build, run, and test the React UI. It
also includes details about the architecture and [guidelines](./ui/ui-guidelines.md) for development.

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
