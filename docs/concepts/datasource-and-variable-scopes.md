# Datasource & Variable scopes

Datasources & Variables in Perses can be configured at different scopes. The available scopes are:

- **Global** - Available to all dashboards. Global datasources & variables are configured in the Admin view.
- **Project** - Available to all dashboards in the given project. Project datasources & variables are configured in the Project view.
- **Dashboard** - Available to the given dashboard only. Dashboard datasources & variables are configured in the Dashboard view.

The idea behind this approach is to:

- Leverage higher scopes for common use cases, allowing the same definition to be reused across multiple dashboards.
- Use lower scopes for more specific needs, restricting the resource availability to a specific (set of) dashboard(s).

Then, once on a dashboard, if multiple resources with the same name exist across different scopes, the resource from the
lower scope takes precedence. This enables transparent overriding for more specific use cases.

![scopes](https://github.com/user-attachments/assets/15e9d6cb-e52c-4e66-9c90-de2cba0c8882)

Let’s see with an example of a Time Series panel that relies on three variables and a datasource:

![overriding example](https://github.com/user-attachments/assets/8765c092-c484-4417-a301-ed44fd5b9822)

The demo datasource used is specific to this dashboard and overrides one defined at the project level, which in turn
overrides a demo datasource defined at the global level.

For the variables:

- The panel uses the standard cluster variable, which is globally defined.
- The namespace list is restricted to those relevant to the project or application, so a custom project-specific
  variable is used instead of the global one.
- The pod variable is defined at the dashboard level, making it accessible exclusively within this dashboard.
