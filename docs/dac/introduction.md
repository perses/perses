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

|                             | CUE | Go |
|-----------------------------|-----|----|
| IDE Support                 | 🟡 | 🟢 |
| Native plugins integration* | 🟢 | 🔴 |
| Validation                  | 🟢 | 🟡 |
| Dependency management       | 🟡 | 🟢 |
| Integration possibilities   | 🔴 | 🟢 |
| Ramp-up effort              | 🔴 | 🟢 |
| Popularity                  | 🔴 | 🟢 |

\* *CUE is the language used for the data model of the plugins, which means you'll always be able to include any external plugin installed in your Perses server into your code when using the CUE SDK. However, the Golang SDK may not support all the plugins: it's basically up to each plugin developer to provide a Go package to enable the DaC use case. This statement applies also to any other language we might have a SDK for in the future.*

Don't hesitate to try both to see which one suits you best!

Additionally, 'as-code' means it's GitOps-friendly, allowing you to benefit from:

- Version history
- Peer-review of changes before rollout
- Automated deployments
- And more...

Interested in this topic? Check out the [Getting Started](./getting-started.md) guide to learn more.
