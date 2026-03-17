# Components

This section lists all Insights on Premises components and their description, including links to their respective repositories.

## Overview

The components are categorized into applications that they belong to. The Core category contains components that are essential for the Insights services to function.

| Name | Application | Description |
|------|-------------|-------------|
| **advisor-backend** | Advisor | Recommendation backend service. |
| **advisor-frontend** | Advisor | Frontend for the recommendation service. |
| **host-inventory** | Core | Host Based Inventory service that stores host facts and their status. |
| **host-inventory-frontend** | Core | Frontend for the Inventory, required by the Advisor frontend. |
| **ingress** | Core | Entry point for accepting archive uploads from the Insights client. |
| **insights-engine** | Advisor | Proecssing engine with rules for the Advisor recommendation service. |
| **iop-gateway** | Core | API gateway and smart proxy relay for Foreman. See [**Gateway**](./architecture/gateway.md) for more details. |
| kafka<sup>1</sup> | Core | (External) Event-streaming platform and inter-service communication and queuing method. |
| **puptoo** | Core | Archive upload processor and verifier for archives produced by the Insights client collectors. |
| **remediations** | Core | Ansible playbook provider and generator. |
| **vmaas** | Vulnerability | Vulnerability Metadata service that scans RPM repositories and provides data for the Vulnerability service. |
| **vulnerability-engine** | Vulnerability | Vulnerability backend that utilizes VMaaS to evaluate hosts data and provides vulnerability results. |
| **vulnerability-frontend** | Vulnerability | Frontend for the vulnerability service. |
| **yuptoo** | Core | Subscription host data processor for Foreman reports. |

:::info
<sup>1</sup> Kafka is an external dependency. See section [**Kafka**](./architecture/index.md#kafka) in the Architecture chapter for more details.
:::

## Repositories

| Name | Source | Image | Introduced |
|------|--------|-------|------------|
| **advisor-backend** | [GitHub](https://github.com/RedHatInsights/advisor-backend/) | [`quay.io/iop/advisor-backend`](https://quay.io/repository/iop/advisor-backend) | foreman 3.16 |
| **advisor-frontend** | [GitHub](https://github.com/RedHatInsights/insights-advisor-frontend) | [`quay.io/iop/advisor-frontend`](https://quay.io/repository/iop/advisor-frontend) | foreman 3.16 |
| **host-inventory** | [GitHub](https://github.com/RedHatInsights/insights-host-inventory) | [`quay.io/iop/host-inventory`](https://quay.io/repository/iop/host-inventory) | foreman 3.16 |
| **host-inventory-frontend** | [GitHub](https://github.com/RedHatInsights/insights-inventory-frontend) | [`quay.io/iop/host-inventory-frontend`](https://quay.io/repository/iop/host-inventory-frontend) | foreman 3.16 |
| **ingress** | [GitHub](https://github.com/RedHatInsights/insights-ingress-go) | [`quay.io/iop/ingress`](https://quay.io/repository/iop/ingress) | foreman 3.16 |
| **insights-engine** | [GitHub](https://github.com/RedHatInsights/insights-engine) | [`quay.io/iop/insights-engine`](https://quay.io/repository/iop/insights-engine) | foreman 3.16 |
| **iop-gateway** | [GitHub](https://github.com/RedHatInsights/iop-gateway/) | [`quay.io/iop/gateway`](https://quay.io/repository/iop/gateway) | foreman 3.16 |
| kafka<sup>1</sup> | [strimzi/strimzi-kafka-operator](https://github.com/strimzi/strimzi-kafka-operator) | [`quay.io/strimzi/kafka](https://quay.io/repository/strimzi/kafka) | foreman 3.16 |
| **puptoo** | [GitHub](https://github.com/RedHatInsights/insights-puptoo) | [`quay.io/iop/puptoo`](https://quay.io/repository/iop/puptoo) | foreman 3.16 |
| **remediations** | [GitHub](https://github.com/RedHatInsights/insights-remediations) | [`quay.io/iop/remediations`](https://quay.io/repository/iop/remediations) | foreman 3.16 |
| **vmaas** | [GitHub](https://github.com/RedHatInsights/vmaas) | [`quay.io/iop/vmaas`](https://quay.io/repository/iop/vmaas) | foreman 3.16 |
| **vulnerability-engine** | [GitHub](https://github.com/RedHatInsights/vulnerability-engine/) | [`quay.io/iop/vulnerability-engine`](https://quay.io/repository/iop/vulnerability-engine) | foreman 3.16 |
| **vulnerability-frontend** | [GitHub](https://github.com/RedHatInsights/vulnerability-ui) | [`quay.io/iop/vulnerability-frontend`](https://quay.io/repository/iop/vulnerability-frontend) | foreman 3.16 |
| **yuptoo** | [GitHub](https://github.com/RedHatInsights/yuptoo) | [`quay.io/iop/yuptoo`](https://quay.io/repository/iop/yuptoo) | foreman 3.16 |

:::info
<sup>1</sup> Kafka is an external dependency. See section [**Kafka**](./architecture/index.md#kafka) in the Architecture chapter for more details.
:::

## Containers

Here is the list of all containers that might be running on a Foreman instance.
Containers are categorized into types:
* API Backend: A long running service container that provides public (or internal) APIs.
* Processor: A long running service container that processes data from Kafka topics or other sources.
* One-off: Short-lived container that runs a one-time task, usually after first installation.
* Cronjob: Container that is triggered in regular intervals by a systemd timer.

:::warning
The list might vary depending on the version of Insights on Premises deployment and could change at any point of development.
:::

| Container | Component | Application | Type |
|-----------|-----------|-------------|------|
| `iop-core-engine` | insights-engine | Advisor | Processor |
| `iop-core-gateway` | iop-gateway | Core | *API Gateway* |
| `iop-core-host-inventory` | host-inventory | Core | Processor |
| `iop-core-host-inventory-api` | host-inventory | Core | API Backend |
| `iop-core-host-inventory-cleanup` | host-inventory | Core | Cronjob |
| `iop-core-host-inventory-migrate` | host-inventory | Core | One-off |
| `iop-core-ingress` | ingress | Core | API Backend |
| `iop-core-kafka` | kafka | Core | *Kafka* |
| `iop-core-puptoo` | puptoo | Core | Processor |
| `iop-core-yuptoo` | yuptoo | Core | Processor |
| `iop-service-advisor-backend-api` | advisor-backend | Advisor | API Backend |
| `iop-service-advisor-backend-service` | advisor-backend | Advisor | Processor |
| `iop-service-remediations-api` | remediations | Core | API Backend |
| `iop-service-vmaas-reposcan` | vmaas | Vulnerability | Processor & API Backend (internal) |
| `iop-service-vmaas-webapp-go` | vmaas | Vulnerability | API Backend (internal) |
| `iop-service-vuln-dbupgrade` | vulnerability-engine | Vulnerability | One-off |
| `iop-service-vuln-evaluator-recalc` | vulnerability-engine | Vulnerability | Processor |
| `iop-service-vuln-evaluator-upload` | vulnerability-engine | Vulnerability | Processor |
| `iop-service-vuln-grouper` | vulnerability-engine | Vulnerability | Processor |
| `iop-service-vuln-listener` | vulnerability-engine | Vulnerability | Processor |
| `iop-service-vuln-manager` | vulnerability-engine | Vulnerability | API Backend |
| `iop-service-vuln-taskomatic` | vulnerability-engine | Vulnerability | Processor |
| `iop-service-vuln-vmaas-sync` | vulnerability-engine | Vulnerability | Cronjob |
