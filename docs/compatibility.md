# Being compatible with Perses

This document is here to explain what means for a software or a tool to be compatible with Perses.

!!! warning
    This documentation can change over the time. Therefor a software that said it is compatible with Perses today may not be compatible anymore in the future if Perses changes its specifications or APIs. 
    Always check the latest documentation to ensure compatibility.

## What does "compatible with Perses" mean?

For the moment, being compatible with Perses means that your software is able to create dashboards that follow the Perses dashboard specification.
This means that the dashboards created with your software can be used directly in Perses without any modification. And vice versa, dashboards created with Perses can be used directly in your software without any modification.

Note that the dashboard definition is including the datasource definition. So being compatible with Perses also means that your software needs to support and manage the data-sources.
But it does not imply that your software needs to support the same datasource as Perses.

## What value does it bring?

Being compatible with Perses will allow your software to use a couple of features of Perses, such as:
- Using Perses solutions for the Dashboard-as-Code feature, which includes:
  - Using the Perses SDKs to define dashboards programmatically.
  - Using the GitHub Actions provided by Perses to automate your dashboard validation and deployment.
- You can use the Perses migration tool to migrate dashboards from Grafana to Perses.
- You can use the Perses CLI (`percli`) to validate your dashboards. You can even integrate it into your CI/CD pipelines, and bring your own linter rules if needed.

## How do you know if your software is compatible with Perses?

If you want to know if your software is compatible with Perses, the easy way is to check if the Perses CLI is able to validate your dashboard. If it is the case, then congratulations, your software is compatible with Perses!
