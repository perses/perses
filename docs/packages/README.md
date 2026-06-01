# Perses Packages

This section outlines the purpose of each Perses package. It provides guidance on which packages to install and how developers can contribute to the repository. 


## Spec `@perses-dev/spec`

**Source:** [spec](https://github.com/perses/spec)

Spec package contains the Perses dashboard and datasource formats. Its primary role is to define the structure of Perses resources so they can be understood by different tools and languages.
Using this package ensures your dashboards are compatible with the core Perses platform.

For more information about Open Specification, see the [Open Specification](https://perses.dev/perses/docs/concepts/open-specification/)

> As Perses has a plugin oriented architecture, these specifications are partial as they only cover the core features of
> the dashboard and datasource formats. Plugin authors are expected to extend these specifications with their own custom fields as needed.



## Components `@perses-dev/components`

**Source:** [components](https://github.com/perses/shared)

This package is the foundational UI library for the Perses ecosystem. It contains the shared React components used to build dashboards and plugins.
The package provides a unified look and feel for all visual elements and should be installed as a dependency for developers who want to integrate specific Perses visual plugins into their own applications.
So, in a nutshell, the package offers a toolbox of pre-built components so plugin authors can focus on data logic rather than UI implementation.
If you are developing a Perses panel or explorer plugin, it is very likely that you require the dependency. 

For more information about plugins, see the [Plugin Development Guide](https://perses.dev/perses/docs/plugins/creation/).

### Key Dependencies

The components package relies on the following core technologies:
*   **React & MUI:** Used for component structure and Material Design theming.
*   **ECharts:** The engine powering all data visualizations.
*   **Pragmatic Drag-and-Drop:** Enables interactive dashboard layouts.
*   **React Table & Hook Form:** Used for data-heavy displays and configuration management.
*   **Perses Spec:** Integrated with internal `@perses-dev/spec` logic for spec data models.

## Dashboards `@perses-dev/dashboards`

**Source:** [dashboards](https://github.com/perses/shared)

This package provides the core logic and React components required to render and manage dashboards.
It offers the high-level components needed to display an entire dashboard including 
the grid layout and panel management. Besides, it exposes the dashboard context through providers, which are explained below.

### Dashboard Provider

Its role is to manage the lifecycle, structural integrity, and interactive editing state of a Dashboard resource.
It orchestrates all CRUD operations for panels and panel groups.
This includes handling complex UI workflows like duplicating panels, editing raw JSON, and managing confirmation dialogs for saving or discarding changes.

### Datasource Store Provider

The provider implements the "Datasource Discovery Logic" for the platform.
When a panel requests data, the provider searches for a matching datasource in a specific order of precedence:

* **Dashboard Level**: Local definitions specific to the current dashboard.
* **Project Level**: Shared resources available within the specific project.
* **Global Level**: System-wide resources available to all dashboards.

### Variable Provider

The VariableProvider acts as the central state manager for all dashboard variables.
It tracks which variables are available (both local to the dashboard and global to the system) and manages the background loading states for dynamic dropdown options. 
While it typically manages dashboard-level variables, it can be reused at the Project or Global level to allow admins to edit higher-scope settings using the same logic.

## Plugin System `@perses-dev/plugin-system`

**Source:** [plugin-system](https://github.com/perses/shared)

The `@perses-dev/plugin-system` acts as the bridge between the dashboard and its plugins.
It provides the necessary execution environment, data-fetching logic (the actual network call happens in plugins), and shared UI components that allow plugins to function within the Perses ecosystem.
The plugin system enables developers to build and test custom plugins independently of the Perses core. Using Module Federation, the system can dynamically load plugins at runtime. This means you can develop a plugin on your local machine and load it directly into a running dashboard for real-time testing and iteration.

### TimeRangeProvider
 The "Global Clock" that keeps every plugin on the dashboard synchronized to the same time window. 
