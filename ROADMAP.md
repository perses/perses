# ROADMAP

## K8s Native

Perses as a dashboard tooling should be Kubernetes native. That means being able to deploy Perses on K8s and being able
to deploy dashboard alongside the associated applications.

For that, we aim to provide:

- an operator that will deploy Perses and the required CRDs. Work is going one in the
  repository https://github.com/perses/perses-operator.
- a helm chart that should help to install Perses with or without the operator on k8s. Work is available in the
  repository: https://github.com/perses/helm-charts.

## Plugin system

While we already have a plugin system, it has a couple of limitations:

- First, we are not able to externalize the plugins. So that means any plugin needs to be built in the upstream
  application which is super limited as we won't be able to accept and maintain any kind of plugin the community / end
  user would like.
- Then today, it's really hard to understand how we can implement a plugin, and that shouldn't be the case at all.

So for the next 6 months, we are going to entirely review the plugin architecture.

Here is the issue if you want to follow this topic: https://github.com/perses/perses/issues/1543

## Explorer

When you are creating a dashboard, you are sometimes facing the issue that you don't really know the name of a metrics,
what it looks like, etc.

So having an Observability explorer to see metrics, traces and logs is a real need.

Here is the discussion if you want to follow this topic: https://github.com/perses/perses/discussions/1859

## Alert view

We are thinking about creating an alert view in the Perses application. There is no current work on this area for the
moment. It will come once above goals are finished.

If you would like to start to work on that, no worries probably opening a discussion to propose a design would be a start.
