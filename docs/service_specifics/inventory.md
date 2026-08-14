# Inventory

[Host Based Inventory (HBI)](https://github.com/RedHatInsights/insights-host-inventory) is the source of truth for system, or host, information across the entire platform. HBI consumes information about hosts from reporters, like insights-client, RHSM or Satellite.

It consists of two containers:

- `iop-core-host-inventory`,
- `iop-core-host-inventory-api`.

It consists of four systemd units:

- `iop-core-host-inventory-api`,
- `iop-core-host-inventory-cleanup`,
- `iop-core-host-inventory`,
- `iop-core-host-inventory-migrate`.

The systemd unit files are stored under `/etc/containers/systemd/`.

The documentation for HBI could be found [here](https://github.com/RedHatInsights/insights-host-inventory/blob/master/docs/index.md).

## FDW

HBI uses `Foreign data wrapper` to share data with other services such as Advisor. The VIEW looks like this:

```
CREATE OR REPLACE VIEW "inventory"."hosts" AS SELECT
        h.id,
        h.account,
        h.display_name,
        h.created_on as created,
        h.modified_on as updated,
        h.stale_timestamp,
        h.stale_warning_timestamp,
        h.deletion_timestamp AS culled_timestamp,
        h.tags_alt as tags,
        h.system_profile_facts as system_profile,
        (h.canonical_facts ->> 'insights_id')::uuid as insights_id,
        h.reporter,
        h.per_reporter_staleness,
        h.org_id,
        h.groups,
        h.last_check_in
      FROM hbi.hosts h
      WHERE (h.canonical_facts->'insights_id' IS NOT NULL);
```

Note: `system_profile` is json blob column which consists of multiple attributes. It is proven that attribute `owner_id` is necessary. Without it the `insights-client` won't report data.

## Host Culling

The Host Culling is cloud feature which should be turned off in On-Premises environment. It is turned off using variable `DISABLE_HOST_CULLING=true` which is set for both containers.