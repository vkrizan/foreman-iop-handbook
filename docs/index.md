# Insights on Premises Handbook

## Introduction

Insights on Premises (IoP), marketed as Red Hat Lightspeed, are cloud services that offer system management analysis. They provide a recommendation system focusing on stability, availability, and security, as well as vulnerability management.

These services are originally hosted on [https://console.redhat.com/insights/](https://console.redhat.com/insights/). This is the on-premises version that operates on Satellite as its vehicle. Unlike the hosted variant, where services are deployed on OpenShift/Kubernetes, here they run as containers managed by systemd and podman. The upstream container images are published on [Quay.io](http://Quay.io) under the [IoP organization](https://quay.io/organization/iop).

## Terminology

:::note
The term *service* and *application* are used interchangeably. They both refer to a software component that provides a specific functionality.
:::

:::note
The term *host* and *system* can be used interchangeably. They both refer to a physical or virtual machine that runs on an operating system.
:::
