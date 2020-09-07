[![Cryb OSS](.github/cryb.png "Cryb OSS Logo")](https://cryb.app)

**@cryb/xen**<sup>Beta</sup> - _Portal hypervisor_

[![GitHub contributors](https://img.shields.io/github/contributors/crybapp/xen)](https://github.com/crybapp/xen/graphs/contributors) [![License](https://img.shields.io/github/license/crybapp/xen)](https://github.com/crybapp/xen/blob/master/LICENSE) [![Patreon Donate](https://img.shields.io/badge/donate-Patreon-red.svg)](https://patreon.com/cryb) [![Chat on Discord](https://discordapp.com/api/guilds/594942455749672983/widget.png)](https://discord.gg/xdhEgD5)

## Docs

* [Info](#info)
  * [Status](#status)
* [Codebase](#codebase)
  * [Folder Structure](#folder-structure)
* [Questions / Issues](#questions--issues)

## Info

`@cryb/xen` is the command line tool and hypervisor used to manage `@cryb/portal` interacting with `@cryb/atlas`.

### Status

`@cryb/xen` has been actively developed since December 2019.

## Codebase

The codebase for `@cryb/xen` is written in JavaScript, utilising Node.js.

### Folder Structure

```
cryb/xen/
├─── bin # Location of utils like @cryb/portal, etc
├─── commands # Command modules
└─── drivers # Config files for Docker, etc
```

## Questions / Issues

If you have an issues with `@cryb/xen`, please either open a GitHub issue, contact a maintainer or join the [Cryb Discord Server](https://discord.gg/xdhEgD5) and ask in `#tech-support`.
