## 0.5.0 / 2022-07-19

- [ENHANCEMENT] gauge chart support additional units #481
- [FEATURE] support echarts theme customization #480
- [BUGFIX] line chart query error handling #479
- [ENHANCEMENT] BE: support charts without datasource, add text plugin #478
- [FEATURE] Add ability to show info icon next to panel header #465
- [FEATURE] `thresholds` support in line chart #462
- [FEATURE] echarts legends using `show_legend` in line chart #462
- [ENHANCEMENT] enable data zoom by default in line chart #462
- [ENHANCEMENT] add Bytes formatting to line and stats charts #462
- [ENHANCEMENT] stat chart selectable text and theme improvements #462
- [ENHANCEMENT] cue format improvements #463, #470
- [ENHANCEMENT] Validator: support query types as plugins #459
- [ENHANCEMENT] configurable charts location, remove configurability of base def #457
- [ENHANCEMENT] align layout definition between frontend and backend #454
- [ENHANCEMENT] release process and license header improvements #452, #453, #456
- [ENHANCEMENT] add documentation regarding how Perses might work on k8s #448

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
