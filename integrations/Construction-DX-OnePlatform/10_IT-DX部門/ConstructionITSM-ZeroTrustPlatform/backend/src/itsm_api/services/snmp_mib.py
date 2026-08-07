"""OID -> semantic resolution table for Cisco SNMP traps.

Covers a minimal but useful subset: linkUp/linkDown, coldStart/warmStart,
authentication failure, BGP/OSPF state changes. Unknown OIDs fall back to
``(None, "medium", oid)``.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TrapSemantic:
    name: str
    severity: str
    description: str


# OID -> semantic
OID_MAP: dict[str, TrapSemantic] = {
    "1.3.6.1.6.3.1.1.5.1": TrapSemantic("coldStart", "medium", "Device cold start"),
    "1.3.6.1.6.3.1.1.5.2": TrapSemantic("warmStart", "low", "Device warm start"),
    "1.3.6.1.6.3.1.1.5.3": TrapSemantic("linkDown", "high", "Interface link down"),
    "1.3.6.1.6.3.1.1.5.4": TrapSemantic("linkUp", "info", "Interface link up"),
    "1.3.6.1.6.3.1.1.5.5": TrapSemantic(
        "authenticationFailure", "high", "SNMP authentication failure"
    ),
    "1.3.6.1.6.3.1.1.5.6": TrapSemantic("egpNeighborLoss", "high", "EGP neighbor loss"),
    "1.3.6.1.2.1.15.7.2": TrapSemantic("bgpBackwardTransition", "high", "BGP backward transition"),
    "1.3.6.1.2.1.15.7.1": TrapSemantic("bgpEstablished", "info", "BGP session established"),
    # Cisco-specific (commonly seen)
    "1.3.6.1.4.1.9.9.41.2.0.1": TrapSemantic(
        "clogMessageGenerated", "medium", "Cisco syslog trap generated"
    ),
}


def resolve(oid: str) -> TrapSemantic:
    """Resolve an OID (or symbolic name) to a TrapSemantic."""
    if not oid:
        return TrapSemantic("unknown", "medium", "")
    # exact OID match
    if oid in OID_MAP:
        return OID_MAP[oid]
    # name-based heuristic (pysnmp sometimes resolves to symbolic name)
    lo = oid.lower()
    for v in OID_MAP.values():
        if v.name.lower() in lo:
            return v
    return TrapSemantic("unknown", "medium", oid)


def severity_for(oid: str) -> str:
    return resolve(oid).severity


def interface_from_varbinds(varbinds: dict[str, str]) -> str | None:
    """Extract ``ifDescr`` / ``ifIndex`` -> readable interface name."""
    for key in ("ifDescr", "1.3.6.1.2.1.2.2.1.2", "ifName"):
        for k, v in varbinds.items():
            if key in k:
                return v
    return None
