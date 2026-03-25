# Permissions & RBAC

Access control and permissions for Insights on Premises (IoP) rely heavily on the Foreman [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/), which facilitates the connection to the IoP services. This plugin acts as the primary API gateway to Insights services and is central to handling permissions, effectively replacing the standard RBAC role enforcement typically found in cloud environments. See also [Integration with Foreman](./gateway.md#integration-with-foreman).

## Authentication

Authentication is handled by Foreman. Requests coming to Insights via the IoP Gateway are considered authenticated. The Foreman [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/) ensures that the requests contain the Foreman organization of an authenticated user or host. See [Identity Handling](./gateway.md#identity-handling).

## Authorization

Authorization of requests to IoP is performed through API path matching and permission checks. The RH Cloud plugin defines the [matching patterns](https://github.com/theforeman/foreman_rh_cloud/blob/develop/app/services/foreman_rh_cloud/insights_api_forwarder.rb) and maps them to Foreman permissions. The plugin then decides whether to allow the request to IoP depending on the user's permissions.

Requests to IoP are split into two categories:

* `GET` (view) requests
* modifying requests (`POST`/`PUT`/`PATCH`/`DELETE`)

The `GET` requests have additional view scoping done by utilizing host tags. Modifying requests are limited to the Foreman organization level. Tag scoping is not in effect for modifying requests.

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

The RH Cloud plugin is responsible for setting host tags for `GET` requests on hosts to which the user has view access. The plugin uses an internal API (`POST https://iop-gateway/tags`) to set the tags on relevant hosts. The tags are specific to the user. The tags are then passed as a `tags` or `tag` (depending on the service) parameter through a query string.

Insights services are responsible for returning only the subset of relevant data based on the host tags received as a parameter. That includes data that returns an aggregate value, such as counts.

## Permissions

Foreman uses roles that include filters with permissions. Users are assigned those roles.

Insights on Premises defines two types of permissions:

* `view_` – corresponding to the GET requests
* `edit_` – for modifying requests

All Insights-related permissions are created under Resource Type `ForemanRhCloud`.

Example:

* `view_advisor`
* `edit_advisor`
* `view_vulnerability`
* `edit_vulnerability`

:::warning
The Resource Type `ForemanRhCloud` might be named differently in a final product.
:::


There are a couple of special permissions (that need an improvement):

* `(Miscellaneous)`
  * `generate_foreman_rh_cloud`
  * `view_foreman_rh_cloud`
  * `dispatch_cloud_requests`
  * `control_organization_insights`
* `Insights hit`
  * `view_insights_hits`

