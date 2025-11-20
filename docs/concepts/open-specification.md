# Open Specification

## What is it about ?

Perses is providing an open specification for defining dashboards and datasources. This specification is used by the Perses application itself to define and manage dashboards, but it is also open for any other software or tool to use it.
We believe that having an open specification is a key factor to ensure interoperability between different tools and software in the observability ecosystem.

This open specification is described in detail in the [Dashboard Specification documentation](../api/dashboard.md).

This open specification is currently implemented in the following languages:
- [Golang](https://go.dev/) available in [pkg/model/api/v1/dashboard.go](https://github.com/perses/perses/blob/main/pkg/model/api/v1/dashboard.go#L93-L104)
- [Cuelang](https://cuelang.org/) available in [cue/common/api/v1/dashboard.cue](https://github.com/perses/perses/blob/main/cue/model/api/v1/dashboard_patch.cue#L38-L50)
- [Typescript](https://www.typescriptlang.org/) available in [ui/core/src/model/dashboard.ts](https://github.com/perses/perses/blob/main/ui/core/src/model/dashboard.ts#L28-L35) via the npm package [@perses-dev/core](https://www.npmjs.com/package/@perses-dev/core)

We aim also to be backward compatible as much as possible. This means that when we release a new version of Perses, we try to ensure that dashboards created with previous versions are still compatible with the new version.
This is not always possible, mainly due to the plugins evolutions. But we try to minimize the impact of such changes, and we aim to provide automatic migration soon. If you are interested in this feature, please read the discussion [here](https://github.com/perses/perses/discussions/1186).
Once this discussion is closed, we will be able to guarantee backward compatibility for future releases.

## Being compatible with Perses
This section is here to explain what means for a software or a tool to be compatible with Perses.

!!! warning
    This documentation can change over the time. Therefor a software that said it is compatible with Perses today may not be compatible anymore in the future if Perses changes its specifications or APIs. 
    Always check the latest documentation to ensure compatibility.

### What does "compatible with Perses" mean?

For the moment, being compatible with Perses means that your software is able to create dashboards that follow the Perses dashboard specification.
This means that the dashboards created with your software can be used directly in Perses without any modification. And vice versa, dashboards created with Perses can be used directly in your software without any modification.

Note that the dashboard definition is including the datasource definition. So being compatible with Perses also means that your software needs to support and manage data-sources.
But it does not imply that your software needs to support the same data source as Perses.

### What value does it bring?

Being compatible with Perses will allow your software to use a couple of features of Perses, such as:
- Using Perses solutions for the Dashboard-as-Code feature, which includes:
  - Using the Perses SDKs to define dashboards programmatically.
  - Using the GitHub Actions provided by Perses to automate your dashboard validation and deployment.
- You can use the Perses migration tool to migrate dashboards from Grafana to Perses.
- You can use the Perses CLI (`percli`) to validate your dashboards. You can even integrate it into your CI/CD pipelines, and bring your own linter rules if needed.

### How do you know if your software is compatible with Perses?

If you want to know if your software is compatible with Perses, the easy way is to check if the Perses CLI is able to validate your dashboard. If it is the case, then congratulations, your software is compatible with Perses!

### What's next?

If you are already compatible with Perses, that's great! You can start using the features mentioned above.
And you can also help us to promote Perses by showing you are an adopters of the project. For that you can follow the instructions in the [Adopters documentation](https://perses.dev/adopters/).
