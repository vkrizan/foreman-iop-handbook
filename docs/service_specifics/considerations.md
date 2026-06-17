# Considerations

The following considerations apply to Insights services operating in the IoP environment. Each describes a constraint or requirement that differs from the hosted cloud deployment.

## Overview

- [RBAC and Permissions](#rbac-and-permissions)
  - disable built-in RBAC
  - support system tags on GET endpoints for scoping
- [Environment Variable Configuration](#environment-variable-configuration) — configure via environment variables, not Clowder
- [Minimal Dependencies](#minimal-dependencies) — avoid S3/Minio, Redis, NoSQL...
- [Disconnected Environment](#disconnected-environment) — no internet connectivity at runtime
- [Container Deployment Model](#container-deployment-model) — one container per service (systemd unit)
- [Upstream Image Builds](#upstream-image-builds) — build upstream images with UBI base
- [PostgreSQL Requirements](#postgresql-requirements)
  -  RHEL-supported PostgreSQL version
  - no SUPERUSER for the applications
- [Temporary Data Volume Pruning](#temporary-data-volume-pruning) — temporary volumes with pruning set up in the installer

## RBAC and Permissions

Services must support disabling their built-in RBAC (or ReRBAC) capabilities. In the cloud, each service enforces access control through a dedicated RBAC service. On premises, permissions are handled at an upper level by Foreman's [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/), which translates Foreman roles and permissions into the access decisions that Insights services expect.

Services must also support system tags on `GET` endpoints. The RH Cloud plugin uses these tags to scope the data returned by `GET` requests to the hosts visible to the current user. Without tag support on the service's API, per-user host scoping cannot be enforced.

See [Permissions & RBAC](../architecture/permissions_rbac.md) for the full authorization model and [GET Request Scoping](../architecture/permissions_rbac.md#get-request-scoping) for details on how tags are applied and used.

## Environment Variable Configuration

Services must be configurable through environment variables. In the cloud, services are configured by [Clowder](https://github.com/RedHatInsights/clowder) — an operator that manages Pod workloads and dynamically generates a JSON configuration file (`cdappconfig.json`) that is mounted into each container. Clowder also provisions dependent infrastructure (databases, Kafka topics, object store buckets).

On premises, Clowder is not used. All service configuration is provided through environment variables, set via Podman quadlet environment directives and [Podman secrets](https://docs.podman.io/en/latest/markdown/podman-secret.1.html) for sensitive values such as database credentials. Services that rely exclusively on Clowder configuration must be adapted to support environment variable–based configuration as a fallback.

See [Quadlets and Configuration](../architecture/index.md#quadlets-and-configuration) for the on-premises configuration model.

## Minimal Dependencies

Services should run with minimal external dependencies. The on-premises environment runs on a single machine and should not require additional infrastructure services beyond [PostgreSQL](../architecture/index.md#postgresql-database) and [Kafka](../architecture/index.md#kafka).

Services should avoid dependencies on:

- S3 or Minio — use a temporary filesystem volume instead (see [Temporary Data Volume Pruning](#temporary-data-volume-pruning))
- Redis
- NoSQL databases (MongoDB, etc.)

## Disconnected Environment

IoP deployments may operate in disconnected (air-gapped) networks with no internet connectivity. Services must not assume they can reach external APIs, download remote resources at runtime, or contact telemetry and license services.

Any data that originates from external sources (e.g., vulnerability metadata, rule content) must be obtainable through an offline synchronization mechanism.

## Container Deployment Model

Each service (equivalent to a Kubernetes Deployment) is currently limited to one container, running as a single systemd unit via a Podman quadlet. This simplifies the deployment model but limits the use of sidecar patterns.

:::note
This limitation could be improved in the future for better scalability and performance. However, supporting multiple containers per service would require changes to the [IoP Gateway](../architecture/gateway.md) to replicate load balancing logic.
:::

See [Architecture Overview](../architecture/index.md#overview) for the deployment topology.

## Upstream Image Builds

Services should build upstream container images. The images are built by GitHub Actions in their respective repositories and published to [Quay.io](https://quay.io/) under the IoP organization. Red Hat Universal Base Images ([UBI](https://catalog.redhat.com/en/software/base-images)) are used as base images.

See the [Architecture](../architecture/index.md) introduction for the upstream image build pattern.

## PostgreSQL Requirements

Services that require a relational database use PostgreSQL. The version must be supported by RHEL — currently PostgreSQL 16.

The database user does not have the `SUPERUSER` role. Database provisioning — including logical database creation, user creation, and credential management — is handled by the installer ([foremanctl](https://github.com/theforeman/foremanctl) or the legacy [puppet-iop](https://github.com/theforeman/puppet-iop/)), not by the service itself. Services must not assume they can create databases, extensions, or roles at runtime.

See [PostgreSQL Database](../architecture/index.md#postgresql-database) and [Database Topology](../architecture/index.md#database-topology) for the database architecture.

## Temporary Data Volume Pruning

Services that use temporary data storage (e.g., archive files, downloaded content) require both a volume and a pruning mechanism. It is up to the installer ([foremanctl](https://github.com/theforeman/foremanctl)) to:

1. Define the temporary volume on the container unit (quadlet) for each service that requires one.
2. Define the pruning mechanism for that volume.

Example patterns from the existing deployment:

- **tmpfiles.d** — systemd's [tmpfiles.d](https://www.freedesktop.org/software/systemd/man/latest/tmpfiles.d.html) for automatic filesystem cleanup. For example, the [Ingress](../architecture/ingress.md) service uses the rule `e /var/tmp/insights-archives - - - 24h` to remove archive files older than 24 hours.
- **systemd timers** — scheduled cleanup tasks for application-level maintenance (e.g., host inventory stale data cleanup every 24 hours).

Services should document their temporary storage needs so that the installer can configure the appropriate volume and pruning.