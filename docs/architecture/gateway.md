

# Gateway

The API gateway for the Insights services is provided by the [IoP Gateway](https://github.com/RedHatInsights/iop-gateway/), built with [nginx](https://nginx.org/). It acts as the entry point to the services that run in their own network. The gateway replaces the cloud-native gateway traditionally used in Kubernetes environments (such as OpenShift).

## IoP Gateway

IoP Gateway is an nginx-based service with custom routing to Insights services and identity handling. Within the Foreman installation, it listens locally on port `24443`. Its secondary purpose is to be registered as a Foreman Smart Proxy to facilitate Insights-to-Foreman communication. See also \[Smart-Proxy\].

HTTPS and authentication are handled through mTLS provided by Foreman (during installation). The certificates are supplied via secrets. The certificate secrets follow this naming convention:

* `iop-core-gateway-server-cert`
* `iop-core-gateway-server-key`
* `iop-core-gateway-server-ca-cert`

Routing to the services is done through a combination of a resolver, nginx variables, and known container hostnames. It uses Podman's resolver, which is available at the first address on Podman's network (default `10.130.0.1`) and is set via the [`resolver`](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver) directive. Container hostnames are set via nginx variables and then used in [`proxy_pass`](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass) directives on defined locations to leverage name resolution.

## Integration with Foreman

The IoP Gateway is registered with Foreman as a Smart Proxy with the capability `iop`. The Smart Proxy entry is set up during installation. The Smart Proxy URL (default [`https://localhost:24443`](https://localhost:24443)) and its existence are later used by Foreman’s plugins to handle the connection to Insights on Premises.

Requests to Insights APIs are handled by the Foreman [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/), which proxies requests to Insights via the IoP Gateway. The main proxy logic is implemented in the [ForemanRhCloud::InsightsApiForwarder](https://github.com/theforeman/foreman_rh_cloud/blob/develop/app/services/foreman_rh_cloud/insights_api_forwarder.rb) class.

```
Apache httpd -> Foreman with rh_cloud plugin -> IoP Gateway -> Insights service
```

The prefix for Insights APIs on a Foreman instance is `/insights_cloud`

```
https://foreman.example.com/insights_cloud/<path>
```

Besides request proxying, the plugin is also responsible for authentication and authorization (RBAC). For example, ensuring Foreman organization via the `X-Org-Id` header and authorizing specific locations and HTTP verbs. See also [Identity Handling](#identity-handling) and [Permissions & RBAC](#todo).

## Identity Handling

Insights services use a custom identity header `X-RH-Identity`, which is base64-encoded JSON describing the authenticated user or host. The main information in the header is the organization ID (`org_id`) and the canonical name of the host (`cn`, for authenticated hosts). The header schema can be found at [identity-schemas](https://github.com/RedHatInsights/identity-schemas) on GitHub.

IoP Gateway replicates the hosted behavior (of a 3scale API gateway) and generates the identity header value with a custom Perl script. The [identity.pl](https://github.com/RedHatInsights/iop-gateway/blob/master/identity.pl) script is then used to populate the `$identity` variable, which individual [`location`](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) directives use in [`proxy_set_header`](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header) settings.

:::info
The Perl support for nginx is provided by the `nginx-mod-http-perl` module.
:::

The `org_id` in the identity header is set from the trusted `X-Org-Id` header, provided by Foreman via the [RH Cloud plugin](https://github.com/theforeman/foreman_rh_cloud/). The organization ID value is aligned with Foreman’s organization label. If the header is not provided, the `org_id` is set to the value of the mTLS certificate organization (`O`).

The identity generation has three possible variants:

* a general user (User type) – a logged-in user,
* a host (System type),
* an internal service user (Associate type) – for service administration.

A host identity is used when the `Forwarded` header is supplied. It expects the host's (subscription) UUID as an obfuscated value in the `for=` key (see [RFC 7239](https://datatracker.ietf.org/doc/html/rfc7239#section-6.3)). For example:

```
Forwarded: for="_00000000-0000-0000-0000-000000000000"
Forwarded: for="_<UUID>"
```

The identity for an internal service user (Associate type) is used only on selected locations and is controlled by the `$identity_type` variable. This applies only to requests without a `Forwarded` header.

```
set $identity_type "associate";
```

Please consult the actual implementation within the [iop-gateway source code](https://github.com/RedHatInsights/iop-gateway/).

## Smart Proxy

Because the IoP Gateway is registered as a Foreman Smart Proxy, it enables Insights services to communicate back to Foreman. Insights services can utilize Foreman’s APIs through IoP Gateway (aka. Smart Proxy Relay) within their isolated network through port `9090`. All requests to Foreman are identified and authorized as a “smart-proxy”

IoP Gateway also maps the smart-proxy certificates via Podman secrets:

* `iop-core-gateway-client-cert`
* `iop-core-gateway-client-key`
* `iop-core-gateway-client-ca-cert`

The Foreman hostname is set in the nginx relay.conf file, which is supplied by the Podman secret `iop-core-gateway-relay-conf`.

Example `relay.conf` contents:

```
# (REQUIRED) CName of the Foreman instance (must match Foreman's TLS certificate)
proxy_ssl_name "foreman.example.com";

# URI to forman
# Example of 10.130.0.1 is the container network gateway.
# This can be kept as is if the network is 10.130.0.0.
proxy_pass "https://10.130.0.1";

# Allow connections only from the container network excluding the network's gateway
deny 10.130.0.1;
allow 10.130.0.0/24;
deny all;
```

## Insights Client Assets

IoP Gateway serves assets for Insights clients on the `/static/release/` path. This includes Python eggs that contain updates to the Insights client collectors.

:::warning
The client assets are currently only provided by Red Hat Lightspeed.
:::
