Perses
======
[![CircleCI](https://circleci.com/gh/perses/perses.svg?style=shield)](https://circleci.com/gh/perses/perses)
[![build](https://github.com/perses/perses/workflows/build/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Abuild)
[![go](https://github.com/perses/perses/workflows/go/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3Ago)
[![react](https://github.com/perses/perses/workflows/react/badge.svg)](https://github.com/perses/perses/actions?query=workflow%3React)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/perses/perses)
[![codecov](https://codecov.io/gh/perses/perses/branch/master/graph/badge.svg?token=M37Y9VSVB5)](https://codecov.io/gh/perses/perses)

## Overview

Perses is part of the [CoreDash community](https://github.com/coredashio/community)

Perses aims to become a dashboard visualization tool for Prometheus and other datasources. It will focus on being
GitOps-compatible via a new and well-defined dashboard definition model. It should ease the adoption of the "Dashboard
as Code"

It aims also to be k8s native and to support the Dashboard As A Service.

## Status

Work in progress and far away to be prod ready. We have the API in place, a beginning of the front-end with plugin
oriented architecture.

Dashboard datamodel is still under review.

### Roadmap

Here an overview of what we are going to implement / provide in a short term

#### First Milestone - Dashboard management

* Define a proper datamodel for the dashboard.
    * The datamodel should be easy to use by SRE / developer (in a GitOps mode)
    * The architecture should support plugins (at least for the panels, but it makes to have it as well for the
      datasources)
    * Focus is to support the Prometheus datasource
* A REST API provides a CRUD to manage the dashboard
* Regarding the UI, focus will be on visualization and for that we will only implement the display of the dashboards.
  Editing dashboard through the UI will be done in the next milestone.
* In terms of visualization we will support for the moment the following chart:
    * Timeseries chart
    * Gauge
    * Stat
    * Table ?
* The UI will support natively a dark and a light theme.
* If possible the UI will be immediately responsive. The display should change depending on the screen size.
* We should be able to load big dashboard without freezing the UI / the browser
* We will be able to load an equivalent of the Node-exporter Dashboard available on
  the [Grafana market](https://grafana.com/grafana/dashboards/1860)
* Perses will be available through a Docker image, and through a binary. (OS targeted: linux, windows, darwin in amd64)
* To prepare the ground around Dashboard as Code, Perses should be able to read the dashboard through the files. The
  idea would be to run locally (and easily) Perses in order to visualize the local dashboard. It will give you an idea
  about the result when you are editing your json/yaml file representing the dashboard.

#### Second Milestone - K8s native

The goal is to be able to deploy Perses on Kubernetes and to support the dashboard a service

* Define k8s CRDs that would be read by Perses. The idea would be to define and deploy the dashboard in the namespace of the
  application. Then Perses will read the dashboards across the different namespaces and display it.
* Be able to define a service discovery configuration for the datasource. The idea is instead of hardcoding a URL in the
  datasource configuration, we will define the configuration of a discovery that then will be used to find how to
  contact the datasource.
* Possibility to define a datasource per namespace. Like that the dashboard of the application could use also a local
  and private Prometheus.
* Give the possibility to edit a dashboard through the UI directly.
* Depending how Perses is loaded (on k8s using CRDs, or using a DB), it won't or will be possible to modify the
  dashboard through Perses (Using the UI or the API directly)

#### Future Milestone - Not yet scoped

* Define a way to secure the access to the different resource.
* Start to support others interesting datasource.
* Snapshot of dashboard

## Contributing and development

Refer to [CONTRIBUTING.md](CONTRIBUTING.md)

## License

The code is licensed under an [Apache 2.0](./LICENSE) license.
