"""cdx-agent CLI.

Subcommands:
  version     Print agent version.
  inventory   Emit current inventory as JSON on stdout.
  heartbeat   Emit a heartbeat record as JSON on stdout.
  config      Print effective runtime configuration.
  enqueue     Collect a payload and append it to the local spool.
  drain       Flush the local spool to the central API (signed requests).
  spool-info  Print spool path and entry count.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence

from cdx_agent import __version__
from cdx_agent.api_client import ApiClient
from cdx_agent.config import AgentConfig, load_config
from cdx_agent.heartbeat import build as build_heartbeat
from cdx_agent.inventory import collect as collect_inventory
from cdx_agent.obs.logging_setup import configure_logging
from cdx_agent.policy import PolicyClient
from cdx_agent.spool import Spool
from cdx_agent.sync import SyncOrchestrator


def _emit_json(payload: object) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2, sort_keys=True)
    sys.stdout.write("\n")


def _cmd_version(_args: argparse.Namespace) -> int:
    sys.stdout.write(f"cdx-agent {__version__}\n")
    return 0


def _cmd_inventory(_args: argparse.Namespace) -> int:
    config = load_config()
    snapshot = collect_inventory(config.device_id)
    _emit_json(snapshot.to_dict())
    return 0


def _cmd_heartbeat(_args: argparse.Namespace) -> int:
    config = load_config()
    heartbeat = build_heartbeat(config.device_id)
    _emit_json(heartbeat.to_dict())
    return 0


def _cmd_config(_args: argparse.Namespace) -> int:
    config = load_config()
    _emit_json(
        {
            "device_id": config.device_id,
            "api_endpoint": config.api_endpoint,
            "profile": config.profile,
            "spool_path": str(config.spool_path),
            "shared_secret_set": bool(config.shared_secret),
        }
    )
    return 0


def _make_orchestrator(config: AgentConfig) -> SyncOrchestrator:
    client = ApiClient(
        base_url=config.api_endpoint,
        device_id=config.device_id,
        shared_secret=config.shared_secret or "unset",
    )
    spool = Spool(config.spool_path)
    return SyncOrchestrator(client, spool)


def _cmd_enqueue(args: argparse.Namespace) -> int:
    import time

    config = load_config()
    orchestrator = _make_orchestrator(config)
    if args.kind == "heartbeat":
        body = build_heartbeat(config.device_id).to_dict()
    else:  # "inventory" — argparse enforces choices, no other value reachable
        body = collect_inventory(config.device_id).to_dict()
    orchestrator.enqueue(args.kind, body, now=time.time())
    _emit_json({"enqueued": args.kind, "spool_path": str(config.spool_path)})
    return 0


def _cmd_drain(_args: argparse.Namespace) -> int:
    config = load_config()
    if not config.shared_secret:
        sys.stderr.write(
            "CDX_SHARED_SECRET is not set; drain would fail HMAC verification. Aborting.\n"
        )
        return 3
    orchestrator = _make_orchestrator(config)
    result = orchestrator.drain()
    _emit_json(
        {
            "total": result.total,
            "sent": result.sent,
            "remaining": result.remaining,
            "failed_status": result.failed_status,
            "all_flushed": result.all_flushed,
        }
    )
    return 0 if result.all_flushed else 4


def _cmd_spool_info(_args: argparse.Namespace) -> int:
    config = load_config()
    spool = Spool(config.spool_path)
    _emit_json({"spool_path": str(config.spool_path), "entries": len(spool)})
    return 0


def _cmd_poll_policy(_args: argparse.Namespace) -> int:
    """Fetch the device's operational policy from the central platform.

    Prints the policy as JSON on stdout. Exits 0 on success, 5 when the fetch
    fails (e.g. server unreachable or 404 for unknown profile) so callers can
    distinguish a policy miss from other errors.
    """
    config = load_config()
    if not config.shared_secret:
        sys.stderr.write(
            "CDX_SHARED_SECRET is not set; policy fetch would fail HMAC verification. Aborting.\n"
        )
        return 3
    client = PolicyClient(
        base_url=config.api_endpoint,
        device_id=config.device_id,
        shared_secret=config.shared_secret,
    )
    result = client.fetch()
    if result.ok and result.policy is not None:
        p = result.policy
        _emit_json(
            {
                "profile": p.profile,
                "update_ring": p.update_ring,
                "heartbeat_interval_seconds": p.heartbeat_interval_seconds,
                "inventory_interval_seconds": p.inventory_interval_seconds,
                "policy_version": p.policy_version,
            }
        )
        return 0
    sys.stderr.write(
        f"policy fetch failed: status={result.status_code} (using built-in defaults)\n"
    )
    return 5


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="cdx-agent",
        description="Construction DX OS device agent.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("version", help="Print agent version").set_defaults(func=_cmd_version)
    sub.add_parser("inventory", help="Collect and emit inventory as JSON").set_defaults(
        func=_cmd_inventory
    )
    sub.add_parser("heartbeat", help="Emit a heartbeat as JSON").set_defaults(
        func=_cmd_heartbeat
    )
    sub.add_parser("config", help="Print effective runtime configuration").set_defaults(
        func=_cmd_config
    )

    enqueue_parser = sub.add_parser("enqueue", help="Collect and spool a payload")
    enqueue_parser.add_argument(
        "kind",
        choices=("heartbeat", "inventory"),
        help="What to collect and spool",
    )
    enqueue_parser.set_defaults(func=_cmd_enqueue)

    sub.add_parser("drain", help="Flush spool to central API").set_defaults(func=_cmd_drain)
    sub.add_parser("spool-info", help="Show spool path and entry count").set_defaults(
        func=_cmd_spool_info
    )
    sub.add_parser(
        "poll-policy",
        help="Fetch operational policy from central platform and print as JSON",
    ).set_defaults(func=_cmd_poll_policy)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    configure_logging()
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))
