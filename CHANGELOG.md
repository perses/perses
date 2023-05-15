# Changelog

## 0.30.0 / 2023-05-11

- [FEATURE] Disable CRUD dialogs in readonly mode (#1129)
- [FEATURE] Support ARM arch for binaries and docker (#1144)
- [ENHANCEMENT] Adjust padding on stat chart so it is centered (#1154)
- [ENHANCEMENT] Update formatting to use exact decimal places (#1152)
- [ENHANCEMENT] Allow saving `duration` from JSON editor (#1149)
- [ENHANCEMENT] Add timerange and refresh buttons on the sticky toolbar (#1145)
- [ENHANCEMENT] Improve algorithm for picking y-axis minimum value (#1146)
- [ENHANCEMENT] Make it possible to set decimal_places as undefined in UI (#1131)
- [ENHANCEMENT] improve search in the home page (#1127)
- [BUGFIX] fix time series tooltip vertical positioning (#1161)
- [BUGFIX] Revert echarts wrapper defaults to fluid width and height (#1164)
- [BUGFIX] fix date handling in tooltip (#1163)
- [BUGFIX] Remove palette edit buttons after merge issue (#1150)
- [BUGFIX] Fix favicon returning 500 inside container (#1148)
- [BUGFIX] Fix empty label value and static list cue schema (#1139)
- [BUGFIX] Prevent calendar icon from flipping over (#1142)
- [BUGFIX] Fix dashboard creation dialog when there is one or less dashboards (#1140)
- [BREAKINGCHANGE] useDefaultTimeRange hook renamed to useDashboardDuration (#1149)

## 0.29.1 / 2023-05-02

- [BUGFIX] Color generation adjustment to error hue cutoff

## 0.29.0 / 2023-05-01

- [FEATURE] Allow TLS configuration for mysql database (#1128)
- [FEATURE] Landing page revamp (#1097)
- [ENHANCEMENT] Allow echarts wrapper to default to fluid width and height (#1115)
- [ENHANCEMENT] Add empty item in Project dropdown (#1130)
- [ENHANCEMENT] Add help text and placeholder for series_name_format control (#1104)
- [ENHANCEMENT] Use abbreviations for time units (#1125)
- [ENHANCEMENT] Categorical palette as default, switch to generative based on total series (#1124)
- [ENHANCEMENT] Auto generated color palette with contrast (#1088)
- [ENHANCEMENT] Improve formatting for percent values (#1120)
- [ENHANCEMENT] Center value when sparkline is undefined (#1101)
- [ENHANCEMENT] Move time series panel reset button (#1103)
- [BUGFIX] Series name formatter return empty string when no resolved label value (#1132)
- [BUGFIX] Fix http method not allowed not handled (#1126)
- [BREAKINGCHANGE] Make "TimeSeriesQuery" required in DefaultPluginKinds (#1123)

## 0.28.0 / 2023-04-17

- [FEATURE] Revamp project page (#1062)
- [ENHANCEMENT] Highlight behavior slight improvement using opacity blur (#1107)
- [ENHANCEMENT] Increase tooltip max height to fit more series w/o scrolling (#1111)
- [BREAKINGCHANGE] Define queries in panel spec instead of panel plugin spec (#1032)

## 0.27.0 / 2023-04-12

- [FEATURE] Categorical color palette support in time series panel spec (JSON only) (#1031)
- [ENHANCEMENT] Y axis origin now auto adjusts based on the data min (#1046)
- [ENHANCEMENT] Add more unit tests for formatDecimal (#1095)
- [ENHANCEMENT] Format bytes with units that are powers of 1000 (#1084)
- [ENHANCEMENT] Virtualize legend to fix perf issues (#1074)
- [ENHANCEMENT] Remove minimumFractionDigits (#1075)
- [ENHANCEMENT] Hide secret when getting the config through the API (#1078)
- [BUGFIX] Respect `series_name_format` in legend and tooltip when metric labels are empty (#1085)
- [BUGFIX] Stat chart value to use threshold color (#1081)
- [BUGFIX] List variable input label should match fieldset (#1083)
- [BUGFIX] Fix tooltip position on long dashboards (#1064)
- [BUGFIX] Dashboard validation: fix issue with variable parsing when the query embeds a regexp
- [BUGFIX] Revert tooltip prop to show full query and always show resolved series name (#1073)
- [BUGFIX] miscellaneous fixes to address console errors (#1068)

## 0.26.1 / 2023-04-03

- [BUGFIX] Add undef check to fix add panel showContent error (#1067)

## 0.26.0 / 2023-04-03

- [FEATURE] Add experimentalEChartsOptionsOverride prop to line chart component (#1023)
- [FEATURE] Stack option support in time series panel (#997)
- [ENHANCEMENT] always show info icon when panel has a description (#1059)
- [ENHANCEMENT] PrometheusLabelValuesVariable plugin: Improve the migration logic to preserve the eventual matcher (#1047)
- [ENHANCEMENT] Ensure all bad request error has the same format (#1043)
- [ENHANCEMENT] Small improvements to the Migrate feature for empty panels and meaningful errors (#1041)
- [ENHANCEMENT] Empty state can include image (#1035)
- [ENHANCEMENT] Fetch updates to show full error message (#1015)
- [BUGFIX] Migrate feature: fix issue with children panels not attached to their parent row when it's expanded (#1052)
- [BUGFIX] Add missing datasource selector in the variable schemas (#1057)
- [BUGFIX] Fix datasource spamming by using a cache (#1042)
- [BUGFIX] Fallback to query when metric labels are empty (#1045)
- [BUGFIX] handle variable default with all in an array (#1029)
- [BUGFIX] Fix the deletion of a project that didn't remove the related dashboards (#1030)
- [BREAKINGCHANGE] export time series data utils from @perses-dev/core (#1053)

## 0.25.0 / 2023-03-20

- [FEATURE] Implement Edit JSON Dialog (#1012)
- [ENHANCEMENT] Logo added to app header (#1010)
- [ENHANCEMENT] Extend datasource with onCreate prop, return warnings (#1019)
- [ENHANCEMENT] TimeSeriesData now supports labels (#1014)
- [ENHANCEMENT] Dashboard displays empty state (#1009)
- [BUGFIX] Make emptyDashboardProps optional on Dashboard (#1028)
- [BUGFIX] Add story for Legend and export LegendProps (#1025)
- [BUGFIX] Fix react warnings (#1021)
- [BUGFIX] Fix getting dashboard from an empty project (#1017)
- [BUGFIX] Add stories for chart components and export prop types (#1008)
- [BUGFIX] Add null checks for layouts and panels in DashboardProvider (#999)
- [BREAKINGCHANGE] Add view mode to empty state (#1022)

## 0.24.0 / 2023-03-06

- [FEATURE] Ability to edit thresholds for Time Series and Stat Charts (#992)
- [FEATURE] Support `connect_nulls` and `show_points` options in time series panel (#990)
- [FEATURE] Ability to edit thresholds in panel options for gauge chart (#968)
- [FEATURE] New `area_opacity` option in time series panel (#962)
- [FEATURE] Support mysql for the main DB (#961)
- [ENHANCEMENT] Legend height increased for tall panels (#998)
- [ENHANCEMENT] Pass headers in Prometheus datasource createClient (#996)
- [ENHANCEMENT] Fix styling of TimeRangeControls (#974)
- [ENHANCEMENT] Migrate custom dialogs to generic dialog component (#965)
- [BUGFIX] Do not show nulls as zero in tooltip (#990)
- [BUGFIX] Do not include tests in compiled output (#976)
- [BUGFIX] Remove semicolon below legend (#975)
- [BREAKINGCHANGE] TimeSeriesValueTuple updates, null now supported for time series data (#990)
- [BREAKINGCHANGE] TimeSeries and TimeSeriesValueTuple Iterable type change (#985)

## 0.23.1 / 2023-02-20

- [ENHANCEMENT] upgrade zustand to latest (#972)

## 0.23.0 / 2023-02-17

- [FEATURE] Add ability to duplicate panels (#949)
- [FEATURE] UI - Add dashboard CRUD (#939)
- [FEATURE] Generic Dialog Components (#948)
- [FEATURE] Initiate project creation/deletion in the frontend (#916)
- [ENHANCEMENT] Modify placement of duplicate panels (#954)
- [ENHANCEMENT] Project routing and list view links (#953)
- [ENHANCEMENT] Add color prop to Buttons (#917)
- [ENHANCEMENT] Remove unnecessary background color (#915)
- [BUGFIX] Allow editing of time range using inputs (#963)
- [BUGFIX] Time series migration add unit inside y_axis (#952)
- [BUGFIX] Round small decimal values when abbreviate is set (#946)
- [BUGFIX] Fix empty dashboard spec that wasn't rejected (#931)
- [BUGFIX] Fix discard changes confirmation dialog showing up even when there is no change (#929)
- [BUGFIX] Fix increased metadata.version (#925)
- [BUGFIX] Fix API error EOF that happens when decoding multiple times the body from a middleware (#923)
- [BREAKINGCHANGE] Move panel padding to plugins (#942)
- [BREAKINGCHANGE] Add a consistent JSON tab for every panel plugin (#922)
- [BREAKINGCHANGE] Remove deprecated top-level `unit` in time series panel (#920)
- [BREAKINGCHANGE] Remove the support of etcd as the main database (#933)

## 0.22.0 / 2023-01-09

- [FEATURE] Add offline mode for the migrate command in the CLI (#901)
- [FEATURE] Use codemirror for query and json editing (#853)
- [FEATURE] Support snapshot UI releases (#844)
- [ENHANCEMENT] Toolbar uses two rows for small screens (#909)
- [ENHANCEMENT] Add prop for adjusting the height of the DownloadButton (#907)
- [ENHANCEMENT] Add dividers to Edit Panel Group dialog (#904)
- [ENHANCEMENT] Use InfoTooltip for all tooltips (#902)
- [ENHANCEMENT] Move edit variables button and make variables wrap to next line (#900)
- [ENHANCEMENT] GaugeChart panel ability to visually edit `max` (#891)
- [ENHANCEMENT] Enable hot reload of the migration schemas (#899)
- [ENHANCEMENT] Add a link to the release in the footer (#880)
- [ENHANCEMENT] CLI can use variables schemas during the validation of dashboard (#881)
- [ENHANCEMENT] Hide horizontal scrollbar in Legend #874
- [BUGFIX] Round suggested stepMs to improve multi query performance (#912)
- [BUGFIX] Reduce calculated min step interval in TimeSeriesPanel (#911)
- [BUGFIX] Fix loading of the cue schemas in the command lint (#898)
- [BUGFIX] GaugeChart do not ignore unit decimal_places and abbreviate (#892)
- [BUGFIX] Toolbar inputs and icons are consistent (#877)
- [BUGFIX] Fix Unmarshal variable display (#876)
- [BUGFIX] default_value is accepted by the backend to be a string or an array (#873)
- [BUGFIX] Fix variable collisions with promQL function (#870)
- [BREAKINGCHANGE] change legend position values to PascalCase, fix resize glitch (#906)
- [BREAKINGCHANGE] tooltip format and PrometheusTimeSeriesQuery series name overhaul (#895)
- [BREAKINGCHANGE] Remove default value for TextVariable (#872)

## 0.21.1 / 2022-12-12

- [BUGFIX] Fix extracted changelog file name (#868)

## 0.21.0 / 2022-12-12

- [FEATURE] Add new endpoints to validate dashboard and datasource (#860)
- [FEATURE] Persist dashboard modification when clicking on save button (#827)
- [FEATURE] gauge panel multiple time series support (#805)
- [FEATURE] Add tooltips to icons in panel and panel group header (#855)
- [FEATURE] Discard Changes Confirmation Dialog (#834)
- [FEATURE] Introduce TimeZoneProvider for specifying a timezone other than browser/local (#825)
- [ENHANCEMENT] Bytes unit default changed to unabbreviated (#847)
- [ENHANCEMENT] visual options and reset btn ux feedback (#850)
- [ENHANCEMENT] legend options editor UX improvements (#845)
- [ENHANCEMENT] Make it possible to adjust the height of the time range controls (#829)
- [ENHANCEMENT] Variable UX fixes (#842)
- [ENHANCEMENT] Update query editor collapse/expand chevrons to match the rest of the dashboard (#854)
- [BUGFIX] show variables when not in edit mode (#866)
- [BUGFIX] add back optimized mode to LineChart (#865)
- [BUGFIX] Decrease size of icons in panel headers (#861)
- [BUGFIX] reset btn dark mode font color (#858)
- [BUGFIX] Fix the way to write file when using the filesystem as a database (#856)
- [BUGFIX] enable data zoom on hover (#851)
- [BUGFIX] fix LineChart timeZone warnings, clean up unused props / types (#849)
- [BUGFIX] Use 24hr time formatting in tooltip (#840)
- [BREAKINGCHANGE] DiscardChangesConfirmationDialog replaces UnsavedChangesConfirmationDialog (#834)
- [BREAKINGCHANGE] `legend.position` now required in time series panel (#848)

## 0.20.0 / 2022-12-05

- [ENHANCEMENT] Allow `decimal_places` to be used with time units #837
- [BUGFIX] Time series panel edit preview shows stale properties #835
- [BUGFIX] Fix time unit value format inconsistencies #837
- [BUGFIX] Fix variable editor dark mode #836
- [BUGFIX] Fix mapping issues with the migrate feature #830

## 0.19.0 / 2022-12-02

- [ENHANCEMENT] set abbreviate to true in default Decimal unit #813
- [ENHANCEMENT] show axisPointer line on hover in time series panel #821
- [ENHANCEMENT] Add ability to set default plugin kinds #815
- [BUGFIX] Fix browser crash when opening panel editor #828

## 0.18.0 / 2022-11-29

- [FEATURE] `y_axis.show` and reset optional props support in TimeSeriesChart #798
- [FEATURE] Add ability to refresh dashboard #777
- [FEATURE] Add a migration page #774 #816
- [FEATURE] add a new field `captured_regexp` to filter the variable list #763
- [ENHANCEMENT] Dashboard view can be configured to be readonly #731
- [ENHANCEMENT] reduce line_width and point_radius max allowed values #798
- [ENHANCEMENT] Add perses design system #804
- [ENHANCEMENT] Add a new option `input` in the CLI command `migrate` #816
- [ENHANCEMENT] Add ability to select multiple legend items #814
- [ENHANCEMENT] Add download button in edit mode #801
- [BUGFIX] Fix variable preview #808
- [BUGFIX] Fix button wrapping when too many vars #803
- [BUGFIX] Fix pressing back button removes query param individually #811
- [BUGFIX] Fix `dashboard.name` when migrating from a Grafana dashboard #812
- [BUGFIX] Fix the permission on the workdir `perses` in the docker images #817
- [BUGFIX] Fix the backend proxy that wasn't working when using a datasource from a project. #816
- [BUGFIX] Fix issue when translating a Perses dashboard from YAML to JSON. #822
- [BREAKINGCHANGE] Bump peer-dependencies @mui/material to v5.10.0 #782
- [BREAKINGCHANGE] useTimeRange now returns timeRange and absoluteTimeRange #777
- [BREAKINGCHANGE] Remove empty chart #809
- [BREAKINGCHANGE] Body accepted by the endpoint `/api/migrate` has been reviewed to be able to provide a list of input
  used later to replace some variables by the values provided in the JSON Grafana dashboard. #816

## 0.17.0 / 2022-11-21

- [FEATURE] custom y_axis `label`, `min`, and `max` properties in time series panel #767, #790
- [FEATURE] Add `migrate` command in the CLI #795
- [FEATURE] Ability to preview ListVariable values while editing #776
- [ENHANCEMENT] Standardize headers for editors #784
- [ENHANCEMENT] Reduce the number of retries #788
- [ENHANCEMENT] add a display field for the dashboards #689
- [BUGFIX] Update the expanded/collapsed icons for panel groups #794

## 0.16.0 / 2022-11-17

- [FEATURE] Add UI for configuring gauge panel options #761
- [FEATURE] Add UI for configuring stat panel options #762
- [FEATURE] add new variable plugin: PrometheusPromQLVariable #758
- [FEATURE] add `line_width` and `point_radius` visual options in time series panel #754
- [FEATURE] Add ability to download dashboard JSON #764
- [ENHANCEMENT] User always sees edit icons in edit mode (instead of only seeing on hover) #748
- [ENHANCEMENT] Add unit selector to time series chart options #744
- [ENHANCEMENT] Add validation for Variables #768
- [BUGFIX] Fix the default config file used in the docker images and in the archive #745
- [BUGFIX] Fix duplicate panel keys #765
- [BUGFIX] Automatically add a Panel Group when adding a Panel to an empty dashboard #766
- [BUGFIX] fix dependsOn for labelValues and labelNames variables #755
- [BUGFIX] Do not send empty queries #770
- [BUGFIX] Reset error boundary on spec change #771
- [BUGFIX] tooltip in LineChart should use unit passed from panel #775

## 0.15.0 / 2022-11-09

- [FEATURE] custom legend formatting in TimeSeriesChart using `series_name_format` query option #709
- [FEATURE] User can collapse / expand queries in the panel editor #718
- [FEATURE] TimeSeriesQuery plugins now accept a `dependsOn` function to optimize loading based on dashboard context
  #732
- [ENHANCEMENT] Dashboard variables list is displayed as a sticky header #703
- [ENHANCEMENT] Disable initial panel animation #710
- [ENHANCEMENT] time range components styling improvements #733
- [ENHANCEMENT] Organize time series options in tabs #741
- [BUGFIX] Fix Variable data model in the backend to be aligned with what is available in the frontend. #734
- [BUGFIX] Back button to dashboard listing broken #735
- [BUGFIX] Fix setDashboard to set metadata #743
- [BREAKINGCHANGE] TimeRangeProvider props changed, `enabledURLParams` added #735
- [BREAKINGCHANGE] Variable display configuration has been aligned with panel display configuration. `display.label`
- [BREAKINGCHANGE] Variable plugins `dependsOn` now returns an object #742
  becomes `display.name` #734

## 0.14.0 / 2022-11-02

- [FEATURE] Add a Project view with a dashboard list section #697
- [FEATURE] Add a breadcrumbs as a dashboard title #702
- [ENHANCEMENT] Adjust panel editor padding #716
- [ENHANCEMENT] Clean up imports and exports to help with package and bundle size #721
- [BUGFIX] ECharts theme performance fix #722
- [BUGFIX] Fix query border #717
- [BUGFIX] Adjust gauge chart radius to avoid clipping #714
- [BREAKINGCHANGE] Chart theme provider `themeName` prop removed #722

## 0.13.0 / 2022-10-31

- [FEATURE] Add endpoint /api/config that will provide the config of the server #700
- [FEATURE] Warn users of any unsaved changes when canceling edit mode #699
- [FEATURE] Update variables based on time range #692
- [FEATURE] Sync variable state with URL #690
- [ENHANCEMENT] Run queries in panel editor on input blur #705
- [ENHANCEMENT] Edit icons no longer appear when previewing a panel in the editor #694
- [BREAKINGCHANGE] DashboardProvider API changes #711
- [BREAKINGCHANGE] Add PluginLoader type to PluginRegistry #704

## 0.12.0 / 2022-10-25

- [FEATURE] Cancel variable editing #673
- [FEATURE] Display dashboard list #677
- [FEATURE] Get dashboard from backend #663
- [ENHANCEMENT] Add border to each query in time series chart editor #676
- [ENHANCEMENT] Save dashboard layout changes #684
- [ENHANCEMENT] Add middleware to verify project exists during a request #680
- [ENHANCEMENT] Review of API e2e tests and remove user endpoint
- [ENHANCEMENT] Add missing datasources definition in dashboard #688
- [ENHANCEMENT] Fallback to text field for gauge and stat editors #678
- [BUGFIX] Fix dao file to be able to return the list when we are at the root of the resources #671
- [BUGFIX] Fix variable editor styling #674
- [BUGFIX] Fix tooltip and other stylings #675
- [BUGFIX] Remove suggested step from time series query key #686
- [BREAKINGCHANGE] `DashboardProvider` API changes #670

## 0.11.0 / 2022-10-19

- [FEATURE] Ability to change variable order #667
- [FEATURE] Save and cancel dashboard visual editing changes #661
- [FEATURE] Add variable plugin editors #647
- [FEATURE] Add and delete queries #656
- [FEATURE] New custom legend in TimeSeriesChart panel #638, #660
- [ENHANCEMENT] Dashboard store renames and clean-up #666
- [ENHANCEMENT] Provide kind and default query parameter to filter the list of datasources #659
- [ENHANCEMENT] Dashboard and datasource validation improvements #635, #636, #637, #641
- [ENHANCEMENT] Review variable data model and migrate variables management to cuelang #629, #654, #662
- [ENHANCEMENT] Modify populate script to generate a local db #658
- [ENHANCEMENT] Update go deps and simplify fsnotify event management #657
- [ENHANCEMENT] Provide a way to determinate the build order of variables #650
- [ENHANCEMENT] Provide a way to pass the API in a readonly mode by config #649
- [ENHANCEMENT] Refactor panel groups to use panel group id everywhere #633
- [ENHANCEMENT] Add circular-dependency-plugin to catch import issues #622
- [BUGFIX] Refactor theme, fix form control width #668
- [BUGFIX] Fix MUI icon dependency in components package #665
- [BUGFIX] Fix panel preview unselected condition #655
- [BUGFIX] Remove edit button on mobile #646
- [BREAKINGCHANGE] New time-range query param approach using `QueryParamProvider` #621
- [BREAKINGCHANGE] `DashboardProvider` API changes to support visual editing #661, #666

## 0.10.0 / 2022-10-12

- [FEATURE] Implement new datasource format #570
- [FEATURE] Add PluginSpecEditor to support a query input and static panel options for TimeSeriesChart #596, #612
- [FEATURE] Add sorting to panel groups #602
- [FEATURE] Delete panel group #617
- [FEATURE] Delete panel #625
- [FEATURE] Add visual editing for template variables #627
- [ENHANCEMENT] Add functionality to DashboardProvider api #590, #598
- [ENHANCEMENT] Add clean as dependency in build script #597
- [ENHANCEMENT] Create initial panel preview component #604
- [ENHANCEMENT] Add an UnknownSpec type for framework code at runtime #609
- [ENHANCEMENT] Implement latest version of panel and query datamodel #614
- [ENHANCEMENT] Simplify cue definitions and use internal schema libs to test all cue schemas #616, #620
- [ENHANCEMENT] New common UI components for working with the plugin system #624
- [BUGFIX] Fix redundant no data in StatChart #606

## 0.9.0 / 2022-10-04

- [FEATURE] New ListVariable plugin for StaticListVariables #547
- [FEATURE] New Prometheus plugin for ListVariable (LabelName, LabelValues) #565
- [FEATURE] Variable chaining support for Prometheus variables #579
- [FEATURE] Visual editor for markdown panel #555, #574
- [FEATURE] Cuelang schema for markdown panel #553
- [ENHANCEMENT] Upgrade react-query to v4 #578
- [ENHANCEMENT] Monorepo / build tooling improvements #550, #567, #583, #585, #586
- [ENHANCEMENT] Update Perses Header, refactor embeddable components #580
- [ENHANCEMENT] Code, tables, lists and links within a markdown panel will be styled, relying on theme for colors #553,
  #563
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

- [FEATURE] Introduce Cuelang schemas to handle the `Panel` data-model. It gives the ability to add new panel & query at
  runtime #422 #434 #435 #457 #459 #478
- [FEATURE] echarts theme customization which allows flexibility when Perses is embedded in other apps #480
- [FEATURE] Add ability to show info icon next to panel header using `display.description` #465
- [FEATURE] `thresholds` support in line chart #462
- [FEATURE] echarts legends using `show_legend` in line chart #462
- [FEATURE] enable data zoom by default in line chart, restore on double click #462
- [ENHANCEMENT] gauge chart support additional units #481
- [ENHANCEMENT] add `Bytes` formatting to line and stats charts #462
- [ENHANCEMENT] stat chart selectable text and theme improvements #462
- [ENHANCEMENT] release process and license header improvements #452, #456
- [ENHANCEMENT] add a version number on every resources managed. This number is increased when a resource is updated.
  #453
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

- [ENHANCEMENT] Merge GitHub workflow for build and release in a single one. It also fixed the publishing of the docker
  images.

## 0.2.0 / 2022-03-24

- [FEATURE] First release using new automated GitHub Actions workflow #336
