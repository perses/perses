# Section 1 - Introduction to Perses

This section introduces you to the Perses project and provides you with an understanding of its role in the CoreDash
community. 

## Under the CoreDash umbrella
CoreDash is a centralized effort to define a standard for visualization and dashboards. It's designed as an umbrella 
project owned by the Linux Foundation to host sub-project efforts like Perses. For more information on the CoreDash 
project:

 - [CoreDash community overview](https://github.com/coredashio/community)

 - [CoreDash contributing guide](https://github.com/coredashio/community/blob/main/CONTRIBUTING.md)

 - [CoreDash subprojects](https://github.com/coredashio/community/blob/main/subprojects.md)

 - First commit: [20 Aug 2021 (Chris Aniszczyk)](https://github.com/coredashio/community/commit/de8bb3a32858f63a765244355a8171290c2a008a)


## What is the Perses project?
Perses is an exploration into finding an open source standard for visualization and dashboards for metrics monitoring. 
Also part of the Linux Foundation with plans to promote to Cloud Native Computing Foundation (CNCF). Some links to 
explore:

 - [Perses project overview](https://github.com/perses/perses)

 - [Perses contributing guide](https://github.com/perses/perses/blob/main/CONTRIBUTING.md)

 - First commit: [26 Jan 2021 (Augustin Husson)](https://github.com/perses/perses/commit/2633d2867d81579e3b8079db5991a440f03b8345)


## Perses project goals
The project has guiding goals for its development:

  1. Become an open standard dashboard visualization tool

     - have well defined dashboard definition model
 
     - statically validated dashboards with CLI and CUE schemas

      - GitOps compatible for dashboard-as-code workflows

      - Perses runs locally, edit dashboard JSON file in Git


  2. Provide embeddable charts and dashboards in any user interface

     - provide different NPM packages

     - example usage could be to improve graph display in Prometheus (or embed)


  3. Target Kubernetes (k8s) native mode
     
     - dashboard defs deployed into & read from app namespaces (CRDs)


  4. Provide complete static validation for CI/CD pipelines

     - Provide command line client: percli
     Architecture supporting future plugins


## Chat with Perses project team?
You can find the project team on Matrix in the [#perses-dev channel](https://matrix.to/#/#perses-dev:matrix.org)

<img src="doc-images/intro-1.png" alt="Matrix dev channel" style="width: 60%;" />


### [[Next section - Installing Perses]](../section-2/installing.md) or [[Back to Index]](../index.md)