# Enabling IoP

This section describes how to enable IoP on Foreman instance where IoP wasn't enabled yet.

## Enabling IoP using Foreman installer

Next step is to enable IoP using installer that is on your machine. For older Foreman version it is `foreman-installer` and for newer versions it is `foremanctl`.

### Enable IoP using foreman-installer

To enable IoP using `foreman-installer` run:

```
foreman-installer --enable-iop
```

If you want to modify IoP configuration files for the installer they are stored under `/usr/share/foreman-installer/modules/iop/`. These configuration files are from [puppet-iop](https://github.com/theforeman/puppet-iop) repository for upstream.

If IoP on this machine uses custom images they are set in `/etc/foreman-installer/custom-hiera.yaml`.

If you want to disable IoP run:

```
foreman-installer --no-enable-iop
```

### Enable IoP using foremanctl

To enable IoP using `foremanctl` run:

```
foremanctl deploy --add-feature iop
```

If you want to edit `foremanctl` files, they are stored in `/usr/share/foremanctl`. The installer is pulled from this [repository](https://github.com/theforeman/foremanctl).

To disable IoP using `foremanctl` run:

```
foremanctl deploy --remove-feature iop
```