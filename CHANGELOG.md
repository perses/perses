## 0.5.2 / 2022-08-12

[ENHANCEMENT] lazy load panels on scroll #500
[BUGFIX] improve tooltip performance when many charts on single dashboard #499

## 0.5.1 / 2022-07-28

[ENHANCEMENT] update prometheus-plugin to use @prometheus-io/lezer-promql #486

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
