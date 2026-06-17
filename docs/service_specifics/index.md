# Service Specifics

Insights services originate from a cloud-hosted environment where they run on Kubernetes/OpenShift with cloud-native infrastructure (Clowder, dedicated RBAC service, object storage, etc.). Insights on Premises (IoP) deploys these services as containers managed by systemd and Podman on a single machine alongside Foreman. This difference in deployment model introduces constraints and requirements that services must account for when being adapted for or onboarded to the IoP environment.

This section documents those requirements.

- [Considerations](./considerations.md) — constraints and requirements for services operating in IoP
- [VMaaS](./vmaas.md) — vulnerability metadata sync pipeline (reposync and CVE map)
