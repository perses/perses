# Perses on Kubernetes

This document aims to describe our vision about how Perses will work on kubernetes.

## 1. Database schema of Perses (outside kubernetes)

For the moment we are using ETCD as a primary database for Perses and our documents have the same fields as in
Kubernetes resources a.k.a `kind`/`metadata`/`spec`.

Using etcd and using the same fields as Kubernetes will help to have Perses natively installed on Kubernetes.

```
               Perses database model                                                             Kubernetes (light) database model

                                                                       │
                                                                       │
                      ┌───────────┐                                    │                                 ┌───────────┐
                      │           │                                    │                                 │           │
          ┌───────────►  Project  ◄────────────┐                       │                     ┌───────────► Namespace ◄────────────┐
          │           │           │            │                       │                     │           │           │            │
          │           └─────▲─────┘            │                       │                     │           └─────▲─────┘            │
          │                 │                  │                       │                     │                 │                  │
┌── ─ ─ ──┼── ─ ─ ─ ─ ─ ─ ──┼── ─ ─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─┐             │           ┌── ─ ─ ──┼── ─ ─ ─ ─ ─ ─ ──┼── ─ ─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─┐
│         │                 │                  │         │             │           │         │                 │                  │         │
│   ┌─────┴─────┐     ┌─────┴─────┐     ┌──────┴────┐    │             │           │   ┌─────┴─────┐     ┌─────┴─────┐     ┌──────┴────┐    │
│   │           │     │           │     │           │    │             │           │   │           │     │           │     │           │    │
│   │ Datasource│     │  Folder   ├─────► Dashboard │    │             │           │   │   Pod     │     │ Deployment│     │ Secrets   │    │
│   │           │     │           │     │           │    │             │           │   │           │     │           │     │           │    │
│   └─────▲─────┘     └───────────┘     └─────┬─────┘    │             │           │   └───────────┘     └───────────┘     └───────────┘    │
│         │                                   │          │             │           │                                                        │
│         │                                   │          │             │           │                       ┌─────────┐                      │
│         │                                   │          │             │           │                       │  ..etc. │                      │
│         └───────────────────────────────────┘          │             │           │                       │         │                      │
│                                                        │             │           │                       └─────────┘                      │
│                                      Project Scope     │             │           │                                      Namespace scope   │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┘             │           └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ──┘
                                                                       │
                                                                       │
                                                                       │
```

With no big surprise, we can see that the Perses database model looks like the one from Kubernetes.

## 2. Document Mapping

On k8s native, the resource `Project` will be a direct mapping to the k8s resource `Namespace`.

Others resources such as `Dashboard` or `Folder` would remain the same and installed through CRDs.

## 3. How does it work for the backend

In this particular context, the Perses backend is a simple proxy to the k8s API, and will be entirely in read only. That
means no user will be able to edit a dashboard through the Perses UI.

### 3.1 Perses backend is using the user token

The user will have to be logged in the k8s API and the UI will use the k8s token to talk with the Perses backend. The
backend will then use the user token when requesting the k8s API.

<img src="http://www.plantuml.com/plantuml/png/RP2nJiOm38JtF8LVW1qne1y10sBfGBSkRcBQYE28dFF-4288hHXpodttoHSO5wlloVcSadYBMK6J50Zcft_2k-cOFbz_Hu6DLuRGuylzWtC_0Bgw7RqRsiGeCFOrSmcW566B5lce0YEVrJWg5hLTQ8OKilmcwdu1ZTRtJgX5Aw9kVqljNsyqe_EqQ-70zTzdso9MYuAQJbEb_DhT1gU_QvlT6SJU2q2M3yxZdEuY6hwE_Ga0">

Note 1: to be entirely in read only, any write endpoint will be deactivated, so even if the user is able to write in its
own namespace, he won't be able to use the Perses API to rewrite a dashboard in his namespace. It's because in this
context, the dashboard(s) is(are) deployed as long as the rest of the application. So you are likely in devops mod and
your deployment is in a git repository (certainly as a helm chart).

Note 2: in this configuration, user won't be able to see others dashboards if he does not have the right to see other
namespaces / dashboards across namespace. It can happen you would like to share the dashboards to all users.

### 3.2 Perses backend will use a dedicated token

Lets imaging you are an SRE in a private company providing the monitoring platform to all your colleagues, they will
need to have full access to every dashboard in order to investigate easily.

To be able to achieve that with the configuration described in 3.1, that means you will have to give a full read access
to every namespace in the k8s cluster. Likely it won't happen since security and the team in charge of k8s will give you
only access to the namespaces you are in charge of and nothing more.

So using the user token won't work. To tackle this use case, Perses backend will simply need a personal token that will
give it full access to every Perses resources (in readonly). So everytime the user will make a request to the Perses
API, it will forward the request to the k8s API using a secret token.

<img src="http://www.plantuml.com/plantuml/png/RP6nJiOm38JtF8LVW1qne1yL1iJIWMvPtCIq4S4HjlF-920e_PNrTFVbBhweeLZzo2wKd2bOAgmmaoZfyZmG7-Qp-dBxBKKqN549dbwdH-T-0N1pV-JkO2E3YBgl1IKgvAJcMUYpaXg4meQ9rRFj18kIW9LtOlS76D2KWb23JBcg3HEjuU1nprKJRt3ETUjFgC-uxkkwU12RUr1AoAgmGj_Gzq5vyumv_-SC1hM_TXVYs2xn1G00">
