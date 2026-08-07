# AppArmor Profile — cdx-agent

## Overview

`usr.bin.cdx-agent` is a Mandatory Access Control (MAC) profile for the
`cdx-agent` binary.  It complements the systemd hardening directives
(`NoNewPrivileges`, `ProtectSystem=strict`, `PrivateTmp`) by enforcing
at the kernel level exactly which files, directories, and network operations
the agent is allowed to perform.

## What the profile allows

| Resource | Access |
|---|---|
| `/etc/cdx-agent/{device_id,shared_secret,agent.env}` | read |
| `/var/lib/cdx-agent/**` (spool) | read + write |
| `/proc/uptime`, `/proc/meminfo`, `/proc/cpuinfo` | read (inventory) |
| `/etc/os-release`, `/etc/machine-id` | read (inventory / device-id) |
| `/usr/lib/python3/**`, `/usr/local/lib/python3*/**` | read (interpreter) |
| TCP (outbound HTTPS to central platform) | connect |
| UDP (DNS) | connect |
| `/tmp/**` (PrivateTmp namespace) | read + write |

## What the profile denies

- Write to `/proc/sys/` or `/sys/`
- `CAP_SYS_ADMIN`, `CAP_SYS_PTRACE`, `CAP_NET_RAW`, `CAP_NET_ADMIN`, `CAP_DAC_OVERRIDE`
- Any path not explicitly listed above

## Deployment

### Manual

```bash
sudo cp usr.bin.cdx-agent /etc/apparmor.d/
sudo apparmor_parser -r /etc/apparmor.d/usr.bin.cdx-agent
```

### Via .deb (planned)

The `postinst` script in the debhelper package will run `apparmor_parser`
automatically.

### Verify enforcement

```bash
sudo aa-status | grep cdx-agent
# Expected: cdx-agent (enforce)
```

### Switch to complain mode (debug)

```bash
sudo aa-complain /etc/apparmor.d/usr.bin.cdx-agent
```

## Phase 2 notes

- Consider adding the `dnsname` AppArmor extension to restrict outbound TCP
  to `central.cdx.local` by hostname rather than allowing all TCP.
- Per-profile policy (`ring0` vs `ring2`) may warrant separate AppArmor
  profiles or hat transitions in Phase 3.
