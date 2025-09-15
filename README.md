<div align="center">

<h1 style="border-bottom: none">
    <a href="https://github.com/perses" target="_blank"><img alt="Perses" src="/docs/images/perses_logo_cropped.svg"></a><br>Perses
</h1>

[![build](https://github.com/perses/perses/workflows/ci/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Aci)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/react/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3AReact)
[![Go Report Card](https://goreportcard.com/badge/github.com/perses/perses)](https://goreportcard.com/report/github.com/perses/perses)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/9410/badge)](https://www.bestpractices.dev/projects/9410)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/perses/perses/badge)](https://securityscorecards.dev/viewer/?uri=github.com/perses/perses)

</div>

## Overview

Perses is first and foremost a dashboard tool that you can use to display a variety of observability data. It currently supports Prometheus metrics & Tempo traces, with plans to expand its capabilities in the future to include logging, profiling, additional technologies for monitoring and tracing, and more.

Perses is a [Cloud Native Computing Foundation](https://cncf.io) sandbox project.

![img.png](https://perses.dev/assets/images/home/perses_overview.gif)

Beyond its core usage, Perses aims to achieve several broader goals:

- **Open specification for dashboards**. Perses is also an initiative to define a standardized dashboard specification, fostering interoperability across observability tools.
- **Integrability**. Perses provides various npm packages that allow developers to embed panels and dashboards into their own UIs, benefiting from the work done in Perses. For instance, these packages could be used in the future to enhance data visualization in the Prometheus UI.
- **Extensibility**. Perses supports multiple kinds of plugins, enabling users to extend the tool’s native capabilities to suit specific needs.
- **GitOps-friendly**. SDKs, CI/CD libraries, static validation, native CLI.. Perses provides everything you need for a great Dashboard-as-Code experience.
- **Kubernetes-native mode**. Dashboard definitions will be deployable into and readable from individual application namespaces using Custom Resource Definitions (CRDs). For more information on that topic you can take a look at the [Perses Operator](https://github.com/perses/perses-operator).

Want to learn more? Check the [documentation website](https://perses.dev).

## Try it

We are providing an online demo available at **https://demo.perses.dev**, where you can check existing dashboards or create your own resources.

## Status

1. Perses as an application can now **be used**.
   * The data model reached a stable point, and we are providing multiple panel types that should cover most of the monitoring & tracing use cases.
   * Authentication and authorization are available.
2. On the GitOps aspect:
   * We provide a CLI that helps interacting with the API. A short doc is available [here](./docs/cli.md)
   * Two SDKs (in Golang and in Cuelang) are available for coding dashboards. See [Dashboard-as-Code](./docs/dac/getting-started.md) guide.
     These SDKs will likely evolve based on the feedback we receive. However, changes are expected to focus on adding utility functions rather than introducing breaking changes.
3. A plugin architecture:
   * Enables the externalization of both plugin loading and implementation.
   * The core plugins are maintained in [perses/plugins](https://github.com/perses/plugins) repository.

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

- Go [version 1.23 or greater](https://golang.org/doc/install).
- NodeJS [version 22 or greater](https://nodejs.org/).
- npm [version 10 or greater](https://www.npmjs.com/).

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
