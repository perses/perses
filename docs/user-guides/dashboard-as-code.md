# Dashboard-as-Code

Perses offers the possibility to define dashboards as code instead of going through manipulations on the UI.
But why would you want to do this? Basically Dashboard-as-Code (DaC) is something that becomes useful
at scale, when you have many dashboards to maintain, to keep aligned on certain parts, etc.

DaC benefits can be summarized as follows:
- **Operational efficiency**, by the reusability of a common basis of dashboard components for standard monitoring use cases.
- **Implementation cost reduction**, by leveraging on existing components when creating new dashboards.
- **Maintenance cost reduction**, by making it easier to: cascade the same update on multiple dashboards, keep multiple components aligned with each other, etc..

Most of these benefits comes from not dealing with the Perses JSON format directly: instead, we work with [CUE](https://cuelang.org/), a powerful templating language with a strong emphasis on data validation, that also brings the factorization & dependency management capabilities (well, [not yet!](https://github.com/cue-lang/cue/discussions/2330)) we need here.

Also, as-code means it's GitOps-friendly, meaning that you can also benefit from:
- versions history
- peer-review of changes before rollout
- automated deployments
- and more..

## Getting started

### Prerequisites

- `percli`, the [CLI of Perses](../tooling/cli.md).
- `cue`, the [CLI of Cuelang](https://cuelang.org/).

### Repository setup

Create a new folder that will become your DaC repository, then follow the steps below:

#### 1. Initialize the CUE module

```
cue mod init <module name>
```
See the [CUE documentation](https://cuelang.org/docs/concepts/packages/) for more information about this step.

#### 2. Retrieve the CUE sources from Perses

Unfortunately for now there is no clean way to import the CUE sources from Perses (no proper dependency management available in CUE as already mentionned), so in the meantime we provide the script [dac_setup.sh](../../scripts/dac_setup.sh) that takes care of adding the CUE sources from Perses as external dependencies of your repo. Simply copy this script at the root of your repository and run it. You will have to indicate the version of Perses from which to retrieve the files - unless you have specific case, better to look for the latest one.

## Develop dashboards

You are now fully ready to start developping dashboards as code!

It's first strongly recommended to ramp up on CUE if you are not familiar with this technology. For this have a look at:
- The [official website](https://cuelang.org/) of Cuelang.
- [Cuetorials](https://cuetorials.com/), a 3rd party source of information that is a very good complement.

Then, you can check an example of DaC usage [here](../../internal/test/dac/input.cue). This example is heavily relying on the DaC utilities we provide. To get a deeper understanding of these libs and how to use them, the best thing to do for now is to check directly their source code.

Anytime you want to visualize the final dashboard definition corresponding to your as-code definition, you have to use the `cue` CLI with its `eval` command, as the following:

```
cue eval my_dashboard.cue --out json
```

> [!NOTE]
> the `--out` flag with either 'json' or 'yaml' is recommended to get a clean output, without all the intermediary CUE definitions involved in the dashboard generation process.

## Deploy dashboards

Once you are satisfied with the result of your DaC definition for a given dashboard, you can finally deploy it to Perses by passing the result of `cue eval` to `percli`:
```
cue eval dashboards/* --out yaml | percli apply -f -
```
> [!NOTE]
> This time `--out` is required as `percli` expects either a JSON or YAML input.

### CICD setup

TODO