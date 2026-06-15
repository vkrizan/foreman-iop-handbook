# Permissions & RBAC

Access control and permissions for Insights on Premises (IoP) rely heavily on the Foreman [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/), which facilitates the connection to the IoP services. This plugin acts as the primary API gateway to Insights services and is central to handling permissions, effectively replacing the standard RBAC role enforcement typically found in cloud environments. See also [Integration with Foreman](./gateway.md#integration-with-foreman).

## Why Foreman Handles RBAC

In the hosted (cloud) environment, Insights services rely on a dedicated RBAC service for access control. That service is cloud-specific and is not available on premises. Instead of replicating the entire cloud RBAC stack, IoP delegates access control to Foreman, which already manages users, roles, and host visibility. The RH Cloud plugin bridges the two worlds: it translates Foreman’s role-based permissions into the access decisions that Insights services expect, and it scopes `GET` request data using host tags that reflect each user’s host access.

This approach keeps the Insights service code mostly unchanged — the services simply respect the tags and identity headers they receive, without knowing whether they came from the cloud RBAC service or from Foreman.

## Authentication

Authentication is handled by Foreman. Requests coming to Insights via the IoP Gateway are considered authenticated. The Foreman [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/) ensures that the requests contain the Foreman organization of an authenticated user or host. See [Identity Handling](./gateway.md#identity-handling).

## Authorization

Authorization of requests to IoP is performed through API path matching and permission checks. The RH Cloud plugin defines the [matching patterns](https://github.com/theforeman/foreman_rh_cloud/blob/develop/app/services/foreman_rh_cloud/insights_api_forwarder.rb) and maps them to Foreman permissions. The plugin then decides whether to allow the request to IoP depending on the user’s permissions.

Requests to IoP are split into two categories:

* `GET` (view) requests — scoped to the hosts the user has access to via tags
* modifying requests (`POST`/`PUT`/`PATCH`/`DELETE`) — authorized at the Foreman organization level

The RH Cloud plugin evaluates every forwarded request against the route table (API path + HTTP method) and checks whether the user holds the required Foreman permission. If the permission is missing, the request is rejected before it reaches the Insights service.

:::note
Insights services have the RBAC capabilities turned off, as those are cloud-specific.
:::

:::note
Foreman’s Locations are not supported for Insights on Premises at the moment.
:::

:::warning
Administrators need to be aware of the difference between view permissions, which use host scoping via tags, and modifying (edit) permissions, which are organization-wide.
:::

## GET Request Scoping

Host tags are used to scope the data returned by `GET` requests to the hosts visible to the user.

### How It Works

The RH Cloud plugin determines which hosts the current user has access to (based on Foreman organization, location, and host group filters). It then applies tags to those hosts in Insights’ Host Inventory using a reserved tag namespace. The plugin calls an internal API (`POST https://iop-gateway/tags`) to bulk-set the tags on relevant hosts.

The tags are passed as a `tags` or `tag` (depending on the service) query string parameter when forwarding the `GET` request to the Insights service. The Insights service returns only the data matching the tagged hosts — including aggregate values such as counts.

### Hashed Host ID Set Tags

Rather than creating a per-user tag (which would require managing tag lifecycles tied to user sessions and access changes), IoP uses a deterministic hash of the sorted host ID set as the tag key. This means that two users with access to the same set of hosts will share the same tag, reducing the total number of tags.

The tag value carries a timestamp to enable cleanup. An hourly cleanup job removes stale tags from Host Inventory, ensuring that tags do not accumulate indefinitely.

:::info
The reserved tag namespace is stripped from responses returned to the user, and incoming requests that attempt to pass a reserved-namespace tag are sanitized by the RH Cloud plugin. This prevents users from bypassing the scoping mechanism.
:::

## Permissions

Foreman uses roles that include filters with permissions. Users are assigned those roles.

### Service Permissions

Insights on Premises defines two types of permissions per service:

* `view_<service>` — allows `GET` requests (read access)
* `edit_<service>` — allows modifying requests (`POST`, `PUT`, `PATCH`, `DELETE`)

All Insights-related permissions are created under Resource Type `ForemanRhCloud`.

The following permissions are currently defined:

| Permission | Service | Access Level |
|---|---|---|
| `view_advisor` | Advisor | Read |
| `edit_advisor` | Advisor | Write |
| `view_vulnerability` | Vulnerability | Read |
| `edit_vulnerability` | Vulnerability | Write |

:::warning
The Resource Type `ForemanRhCloud` might be named differently in a final product.
:::

### Special Permissions

There are additional pre-existing permissions related to the RH Cloud plugin:

* `(Miscellaneous)`
  * `generate_foreman_rh_cloud`
  * `view_foreman_rh_cloud`
  * `dispatch_cloud_requests`
  * `control_organization_insights`
* `Insights hit`
  * `view_insights_hits`

### Route-Based Authorization

Each Insights API path is mapped to a required permission in the RH Cloud plugin’s forwarder configuration. The plugin matches the incoming request path and HTTP method against this route table to determine the required permission.

For example:

* `GET /api/vulnerability/v1/cves` requires `view_vulnerability`
* `PATCH /api/vulnerability/v1/cves/:id/business_risk` requires `edit_vulnerability`
* `GET /api/insights/v1/rule` requires `view_advisor`

The route table acts as a security gate: if a route is not mapped, the request is denied by default.

## Frontend Permissions

Insights frontends need to know the user’s permissions so they can show or hide UI elements (such as action buttons, edit controls, or menu items) based on the user’s access level.

### Permission Hints via Chrome API

The RH Cloud plugin provides the user’s Insights permissions through the `ScalprumContext`, which exposes Chrome APIs to the frontend components. The key API is:

* [`auth.getUserPermissions()`](https://github.com/RedHatInsights/frontend-components/blob/master/docs/chrome/chrome-api.md#getuserpermissions)

This function returns a list of permission objects, each containing an application, resource type, and permission verb. The RH Cloud plugin translates the user’s Foreman permissions into the same DSL (Domain-Specific Language) format that hosted Insights uses, so that frontend components can use the same permission-checking logic regardless of the deployment environment.

:::note
Frontend permission checks are hints for a better user experience — they do not replace the backend authorization. Even if a frontend element is visible, the backend will reject unauthorized requests.
:::

### Translation Layer

The RH Cloud plugin implements a translation layer that converts Foreman permissions (e.g., `view_vulnerability`) into the Insights permission DSL format (e.g., `{permission: "vulnerability:*:read"}`). This ensures consistency between the hosted and on-premises environments, allowing frontend components to use the standard `usePermissions` or `useChrome` hooks without modification.

See [ScalprumModule/ScalprumContext.js](https://github.com/theforeman/foreman_rh_cloud/blob/develop/webpack/common/ScalprumModule/ScalprumContext.js) for the implementation.

## Limitations

* **No Location support.** Foreman’s Locations are not currently used for scoping Insights data. All scoping is done at the Organization level and through host group filters.

* **Edit permissions are organization-wide.** While `view_` permissions are scoped to specific hosts via tags, `edit_` permissions apply to the entire Foreman organization. A user with `edit_vulnerability` can modify any vulnerability data within their organization, regardless of host-level access restrictions.

* **No object-level write granularity.** Insights services do not enforce per-object (per-host, per-CVE) authorization for write operations. The Foreman plugin authorizes at the route level, not the individual resource level.

* **Tags do not authorize writes.** Tags are a read-scoping mechanism only. They cannot be used to restrict which hosts a user can perform write operations on. Write authorization is binary: the user either has `edit_<service>` for the organization or they do not.

* **Users not managed by Foreman.** Foreman can integrate with external user management systems (e.g., LDAP, Active Directory). Users authenticated through these systems have their permissions evaluated at request time, but the host tag cleanup relies on the hourly job, which may leave stale tags for short-lived sessions.
