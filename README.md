Perses
======
[![CircleCI](https://circleci.com/gh/perses/perses.svg?style=shield)](https://circleci.com/gh/perses/perses)
[![build](https://github.com/perses/perses/workflows/build/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Abuild)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/react/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3React)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)
[![codecov](https://codecov.io/gh/perses/perses/branch/master/graph/badge.svg?token=M37Y9VSVB5)](https://codecov.io/gh/perses/perses)

## Overview

Perses is part of the [CoreDash community](https://github.com/coredashio/community).

Perses aims to become a dashboard visualization tool for Prometheus and other datasources. It will focus on being
GitOps-compatible and thus enabling a smooth "dashboards as code" workflow via a new and well-defined dashboard definition model.

It also aims to offer a Kubernetes-native mode in which dashboard definitions can be deployed into and read from individual application namespaces.

## Status

Perses is an early work in progress and is far from production-ready. The current pieces that are in place are:

* A backend API that allows read and write access to dashboard and datasource definitions.
* A beginning of a frontend implementation with a plugin-oriented architecture.

The dashboard data model is still evolving along with the dashboard implementation and new requirements.

### Roadmap

Here is an overview of what we aim to implement / provide in the short term:

#### First Milestone - Reading and displaying dashboards

* Define a proper dashboard data model.
    * The data model should be easy to use by SREs and developers in a GitOps / "dashboards as code" mode.
    * The architecture should support plugins (at least for panels, but likely for
      datasources as well). We are still discussing the plugin architecture design in https://github.com/perses/perses/discussions/72.
    * The initial focus is to support Prometheus as a datasource.
* A REST API that provides a [CRUD interface](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) to manage dashboards and datasources.
* The UI will initially focus on displaying dashboards. Editing dashboards through the UI will be addressed in the next milestone.
* We will initially support the following panel types:
    * Time series charts.
    * Gauge panels.
    * Stat panels (single value with sparkline).
    * Tables (possibly).
* The UI will support light and dark themes.
* The UI will use responsive layout principles to adapt to different screen sizes.
* Large dashboards should not freeze the UI / the browser.
* We want to be able to load an equivalent of the Grafana [Node Exporter dashboard](https://grafana.com/grafana/dashboards/1860).
* Perses will be released as binaries and Docker images, with initial support for Linux, Windows, and Darwin / Mac OS X on amd64.
* To enable initial dashboard-as-code use cases, Perses will be able to read dashboard definitions from local files. This will also allow quick iteration and experimentation when editing YAML/JSON dashboard representations.

#### Second Milestone - Native Kubernetes mode and UI-based dashboard editing

The goal of the second milestone is to support "dashboard as a service" use cases on Kubernetes, as well as allowing UI-based dashboard editing:

* Define Kubernetes CRDs containing dashboard definitions that will be read by Perses. This will allow defining and deploying dashboards along their respective applications in the same namespace. Perses will then allow reading and displaying dashboard definitions across multiple namespaces.
* Allow dynamic discovery of datasources on Kubernetes, rather than hard-coding datasource URLs.
* Allow defining datasources that are local and private to a namespace (e.g. for use cases where each namespace has its own Prometheus server).
* Allow editing dashboards directly through the UI.
* Depending on how Perses is configured (using Kubernetes CRDs or a database), modifying dashboards directly through Perses will or will not be possible (no matter whether the editing happens via the UI or using the API directly).

#### Future Milestone - Not yet scoped

* Define access restrictions and a security model for different resources.
* Add support for datasources other than Prometheus.
* Support creating dashboard snapshots.

## Contributing and development

Refer to [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
