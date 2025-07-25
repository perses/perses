# Overview

!!! note
    Check the [documentation website's home page](https://perses.dev/) to get another overview of Perses with visuals.

Perses is first and foremost a dashboard tool that you can use to display a variety of observability data. It currently supports Prometheus metrics & Tempo traces, with plans to expand its capabilities in the future to include logging, profiling, additional technologies for monitoring and tracing, and more.

Perses is a [Cloud Native Computing Foundation](https://cncf.io) sandbox project.

Beyond its core usage, Perses aims to achieve several broader goals:

- **Open specification for dashboards**. Perses is also an initiative to define a standardized dashboard specification, fostering interoperability across observability tools.
- **Integrability**. Perses provides various npm packages that allow developers to embed panels and dashboards into their own UIs, benefiting from the work done in Perses. For instance, these packages could be used in the future to enhance data visualization in the Prometheus UI.
- **Extensibility**. Perses supports multiple kinds of plugins, enabling users to extend the tool’s native capabilities to suit specific needs.
- **GitOps-friendly**. SDKs, CI/CD libraries, static validation, native CLI.. Perses provides everything you need for a great Dashboard-as-Code experience.
- **Kubernetes-native mode**. Dashboard definitions will be deployable into and readable from individual application namespaces using Custom Resource Definitions (CRDs).

Learn more about these topics throughout the rest of the available documentation.