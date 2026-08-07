"""Tests for SNMP trap event building + MIB resolution."""
from __future__ import annotations

from itsm_api.services import snmp_mib
from itsm_api.services.snmp_collector import build_event, event_to_row


def test_resolve_known_oids() -> None:
    assert snmp_mib.resolve("1.3.6.1.6.3.1.1.5.3").name == "linkDown"
    assert snmp_mib.severity_for("1.3.6.1.6.3.1.1.5.3") == "high"
    assert snmp_mib.resolve("1.3.6.1.6.3.1.1.5.4").severity == "info"


def test_resolve_unknown_is_medium() -> None:
    sem = snmp_mib.resolve("1.2.3.4.5.6")
    assert sem.name == "unknown"
    assert sem.severity == "medium"


def test_build_event_link_down() -> None:
    varbinds = [
        ("1.3.6.1.2.1.1.3.0", "12345"),  # sysUpTime
        ("1.3.6.1.6.3.1.1.4.1.0", "1.3.6.1.6.3.1.1.5.3"),  # trap OID -> linkDown
        ("1.3.6.1.2.1.2.2.1.2.1", "GigabitEthernet0/1"),  # ifDescr
    ]
    ev = build_event(varbinds, device_ip="10.1.1.1")
    assert ev.trap_oid == "1.3.6.1.6.3.1.1.5.3"
    assert ev.severity == "high"
    assert ev.interface == "GigabitEthernet0/1"
    assert ev.device_ip == "10.1.1.1"

    row = event_to_row(ev)
    assert row["trap_oid"] == "1.3.6.1.6.3.1.1.5.3"
    assert row["severity"] == "high"
    assert row["interface"] == "GigabitEthernet0/1"


def test_build_event_auth_failure_severity() -> None:
    varbinds = [
        ("1.3.6.1.2.1.1.3.0", "1"),
        ("1.3.6.1.6.3.1.1.4.1.0", "1.3.6.1.6.3.1.1.5.5"),
    ]
    ev = build_event(varbinds)
    assert ev.severity == "high"
