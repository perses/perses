# Changelog

# 0.9.0 / 2022-10-04

- [FEATURE] New ListVariable plugin for StaticListVariables #547
- [FEATURE] New Prometheus plugin for ListVariable (LabelName, LabelValues) #565
- [FEATURE] Variable chaining support for Prometheus variables #579
- [FEATURE] New editable Markdown panel #553, #555, #563
- [FEATURE] New datasource spec implemented #554, #577
- [ENHANCEMENT] Upgrade react-query to v4 #578
- [ENHANCEMENT] Monorepo / build tooling improvements #550, #567, #583, #585, #586
- [ENHANCEMENT] Update Perses Header, refactor embeddable components #580, 583
- [ENHANCEMENT] Markdown editor includes link to markdown cheatsheet #574
- [ENHANCEMENT] Add optional Datasource selector spec to Prom variables and queries #587
- [BUGFIX] Fix overlapping header issue #580
- [BREAKINGCHANGE] Initial Datasources v2 spec support in UI #577
- [BREAKINGCHANGE] Integrate new PluginRegistry, remove legacy code #559
- [BREAKINGCHANGE] Rename `GraphQuery` to `TimeSeriesQuery` #573
- [BREAKINGCHANGE] Rename `LineChart` panel to `TimeSeriesChart` #575
- [BREAKINGCHANGE] Be consistent with kind and spec in our API, remove `options` #549
- [BREAKINGCHANGE] Switch GraphQuery plugin API to be Promise-based #556

## 0.8.1 / 2022-09-23

- [BUGFIX] Add Dashboard ErrorBoundary, fix grid open state #562

## 0.8.0 / 2022-09-21

- [FEATURE] Add and edit panel groups #546
- [FEATURE] ListVariable and TextVariable have been introduced #535
- [FEATURE] Add a panel that supports markdown (no editing capabilities yet) #532, #541
- [FEATURE] time range selection shareable URLs #530
- [FEATURE] zoom event on a line chart panel updates the dashboard active time range #530
- [ENHANCEMENT] QueryStringProvider allows apps to pass their own utils to update the URL #530
- [ENHANCEMENT] DashboardProvider improvements #540
- [ENHANCEMENT] Governance process changes #431 #522 #523
- [ENHANCEMENT] Use React 18 for development, allow React 17 backward compatability #533
- [ENHANCEMENT] upgrade go to 1.19 #543
- [ENHANCEMENT] build process improvements #489, #490, #491 #515
- [ENHANCEMENT] add datasource documentation #404
- [BUGFIX] fix no kebab case error #538
- [BREAKINGCHANGE] Remove unused validate prop from plugin definitions #526
- [BREAKINGCHANGE] usePlugin needs kind not definition #527
- [BREAKINGCHANGE] Add metadata for individual plugins to plugin module metadata #531
- [BREAKINGCHANGE] Panel plugins now need additional props to support visual editing #528
- [BREAKINGCHANGE] Simplify plugin module export format #534
- [BREAKINGCHANGE] Template variable definitions have changed completely #535
- [BREAKINGCHANGE] Plugin spec for template variables has changed and only supports ListVariables #535

## 0.7.1 / 2022-09-09

- [ENHANCEMENT] Removed react-grid-layout and react-resizable css imports #524

## 0.7.0 / 2022-09-09

- [FEATURE] Edit mode and drag & drop using react-grid-layout #510
- [FEATURE] Add new panel and panel group #517
- [FEATURE] Time range selection: relative time dropdown, absolute time calendar #509
- [BUGFIX] Bytes formatted with 'undefined' as unit #513
- [ENHANCEMENT] Update CONTRIBUTING and ui/README #512 #519
- [ENHANCEMENT] Update Node and NPM to latest #514
- [ENHANCEMENT] Add missing makefile target 'cross-release' #515
- [ENHANCEMENT] Move footer component into App #518

## 0.6.0 / 2022-08-15

- [FEATURE] Pin and enter line chart tooltip on click #505
- [FEATURE] Move variable inputs to the top of dashboard view #498
- [BUGFIX] Fix stuck tooltip when moving cursor quickly #505
- [ENHANCEMENT] Create optional flag that can be used across different commands #491
- [ENHANCEMENT] Refactor how the different files for the CLI are dispatched #490
- [ENHANCEMENT] Review the way to cross build Perses #489

## 0.5.2 / 2022-08-12

- [ENHANCEMENT] lazy load panels on scroll #500
- [BUGFIX] improve tooltip performance when many line charts are on a single dashboard #499

## 0.5.1 / 2022-07-28

- [ENHANCEMENT] update prometheus-plugin to use @prometheus-io/lezer-promql #486

## 0.5.0 / 2022-07-20

- [FEATURE] Introduce Cuelang schemas to handle the `Panel` data-model. It gives the ability to add new panel & query at runtime #422 #434 #435 #457 #459 #478
- [FEATURE] echarts theme customization which allows flexibility when Perses is embedded in other apps #480
- [FEATURE] Add ability to show info icon next to panel header using `display.description` #465
- [FEATURE] `thresholds` support in line chart #462
- [FEATURE] echarts legends using `show_legend` in line chart #462
- [FEATURE] enable data zoom by default in line chart, restore on double click #462
- [ENHANCEMENT] gauge chart support additional units #481
- [ENHANCEMENT] add `Bytes` formatting to line and stats charts #462
- [ENHANCEMENT] stat chart selectable text and theme improvements #462
- [ENHANCEMENT] release process and license header improvements #452, #456
- [ENHANCEMENT] add a version number on every resources managed. This number is increased when a resource is updated. #453
- [ENHANCEMENT] add documentation regarding how Perses might work on k8s #448
- [BUGFIX] line chart query error handling #479
- [BUGFIX] line chart fill empty data regression #462
- [BREAKINGCHANGE] align layout definition between FE and BE, `spec` moved inside `display` #454

## 0.4.2 / 2022-05-18

- [BUGFIX] fix line chart shows time beyond 24 hours #443
- [ENHANCEMENT] add optional max prop for customizing xAxis #443

## 0.4.1 / 2022-05-13

- [BUGFIX] fix line chart xAxis date formatting #439
- [BUGFIX] adjust tooltip key formatting in line chart #438
- [BUGFIX] add core as dependency of components #430
- [BUGFIX] fix go build: set parallelism build to 1 #427
- [ENHANCEMENT] update release title template to include the date #428

## 0.4.0 / 2022-04-26

- [FEATURE] add dark mode support, theme toggle in app header #415
- [ENHANCEMENT] upgrade go to v1.18 #419
- [ENHANCEMENT] use generics to simplify the way to convert slice in CLI #420
- [BUGFIX] Switch bundle output directory to fix app build #421
- [BUGFIX] echarts wrapper disposes canvas too frequently #425

## 0.3.1 / 2022-04-15

- [ENHANCEMENT] Add CommonJS build output to all packages #413
- [BUGFIX] Make tooltip text readable in LineChart #412
- [BUGFIX] Remove `@formatjs/intl-numberformat` dependency #411

## 0.3.0 / 2022-04-12

- [ENHANCEMENT] Ability to embed LineChart independent of a panel
- [ENHANCEMENT] Improve dependencies for NPM package consumers
- [ENHANCEMENT] Remove uplot dependency
- [FEATURE] LineChart visual refinements to tooltips, loading state, yAxis formatting, grid spacing, fonts
- [FEATURE] LineChart hover state that shows focused series symbols
- [FEATURE] LineChart additional props for customizing dataZoom and toolbox icons
- [BUGFIX] Tooltips no longer linger after moving cursor out of canvas
- [BUGFIX] CLI: fix the cmd version to be able print it even if the remote API is not connected or doesn't respond

## 0.2.1 / 2022-03-28

- [ENHANCEMENT] Merge GitHub workflow for build and release in a single one. It also fixed the publishing of the docker images.

## 0.2.0 / 2022-03-24

- [FEATURE] First release using new automated GitHub Actions workflow #336
