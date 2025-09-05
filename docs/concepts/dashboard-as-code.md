# Dashboard-as-Code

Perses offers the possibility to define dashboards as code instead of going through manipulations on the UI.
But why would you want to do this? Basically Dashboard-as-Code (DaC) is something that becomes useful
at scale, when you have many dashboards to maintain, to keep aligned on certain parts, etc.

DaC benefits can be summarized as follows:

- **Operational efficiency**, by the reusability of a common basis of dashboard components for standard monitoring use cases.
- **Implementation cost reduction**, by leveraging on existing components when creating new dashboards.
- **Maintenance cost reduction**, by making it easier to: cascade the same update on multiple dashboards, keep multiple components aligned with each other, etc..

Most of these benefits comes from not dealing with the Perses JSON format directly: instead, we provide SDKs in languages that enable factorization, code imports and more, namely:

* [CUE](https://cuelang.org/), a templating language with a strong emphasis on data validation.
* [Go](https://go.dev/), an opensource programming language, that probably doesn't need to be introduced...

These 2 SDKs come with different pros & cons:

|                           | CUE | Go |
|---------------------------|-----|----|
| IDE Support               | 🟡  | 🟢 |
| Plugins integration*      | 🟢  | 🟡 |
| Validation                | 🟢  | 🟡 |
| Dependency management     | 🟡  | 🟢 |
| Integration possibilities | 🔴  | 🟢 |
| Ramp-up effort            | 🔴  | 🟢 |
| Popularity                | 🔴  | 🟢 |

\* *CUE is the language used for defining the data model of plugins. This means that when using the CUE SDK, you can always include any external plugin installed on your Perses server in your code. However, the Go SDK may not support every plugin you wish to use. Support depends on whether each plugin developer provides a corresponding Go package to enable the DaC use case. This limitation also applies to any other language SDKs we may introduce in the future. That said, rest assured that all official plugins are fully supported in the Go SDK.*

Don't hesitate to try both to see which one suits you best!

Additionally, 'as-code' means it's GitOps-friendly, allowing you to benefit from:

- Version history
- Peer-review of changes before rollout
- Automated deployments
- And more...

Interested in this topic? Check out the [Getting Started](../dac/getting-started.md) guide to learn more.
