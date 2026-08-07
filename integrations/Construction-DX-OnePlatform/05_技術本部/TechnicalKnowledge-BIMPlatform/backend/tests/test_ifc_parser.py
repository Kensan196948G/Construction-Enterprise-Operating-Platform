"""IFC パーサのスモークテスト + 詳細抽出 (Loop #6)."""
from __future__ import annotations

import io

from tech_api.services.ifc_parser import parse_ifc_stream, parse_ifc_text

# 最小限の IFC SPF サンプル (IFC4)
SAMPLE_IFC = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('sample.ifc','2026-05-22T00:00:00',('CDX'),('CDX'),'ifc4','test','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('0YvctVUKr0kugbFTf53O9L',$,'TestProject',$,$,$,$,(#11),#7);
#2=IFCSITE('1YvctVUKr0kugbFTf53O9M',$,'Site1',$,$,$,$,$,$,$,$,$,$);
#3=IFCBUILDING('2YvctVUKr0kugbFTf53O9N',$,'Bldg1',$,$,$,$,$,'Headquarters',$,$,$);
#4=IFCBUILDINGSTOREY('3YvctVUKr0kugbFTf53O9O',$,'L1',$,$,$,$,'Ground Floor',$,0.0);
#10=IFCCARTESIANPOINT((0.0,0.0,0.0));
#11=IFCCARTESIANPOINT((10.0,20.0,5.0));
#12=IFCCARTESIANPOINT((-5.0,7.5,2.0));
ENDSEC;
END-ISO-10303-21;
"""


# Loop #6 拡張サンプル: 階層+部材+集約関係付き
SAMPLE_IFC_DETAILED = """ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('detailed.ifc','2026-05-22T00:00:00',('CDX'),('CDX'),'ifc4','test','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('GUID-PRJ-0001',$,'CDX Project',$,$,$,$,$,$);
#2=IFCSITE('GUID-SITE-0001',$,'Tokyo Site',$,$,$,$,$,$,$,$,$,$,$);
#3=IFCBUILDING('GUID-BLDG-0001',$,'Office',$,$,$,$,'HeadOffice',$,$,$,$);
#4=IFCBUILDINGSTOREY('GUID-STR-0001',$,'F1',$,$,$,$,'Ground',$,0.0);
#5=IFCBUILDINGSTOREY('GUID-STR-0002',$,'F2',$,$,$,$,'Second',$,3500.0);
#6=IFCSPACE('GUID-SP-0001',$,'OfficeRoom',$,$,$,$,'Meeting',.ELEMENT.,$,$);
#10=IFCWALL('GUID-WALL-0001',$,'W1',$,$,$,$,$,$);
#11=IFCWALL('GUID-WALL-0002',$,'W2',$,$,$,$,$,$);
#12=IFCSLAB('GUID-SLAB-0001',$,'S1',$,$,$,$,$,.FLOOR.);
#13=IFCBEAM('GUID-BEAM-0001',$,'B1',$,$,$,$,$,$);
#14=IFCCOLUMN('GUID-COL-0001',$,'C1',$,$,$,$,$,$);
#100=IFCRELAGGREGATES('GUID-AGG-1',$,$,$,#1,(#2));
#101=IFCRELAGGREGATES('GUID-AGG-2',$,$,$,#2,(#3));
#102=IFCRELAGGREGATES('GUID-AGG-3',$,$,$,#3,(#4,#5));
#103=IFCRELAGGREGATES('GUID-AGG-4',$,$,$,#4,(#6));
#200=IFCRELCONTAINEDINSPATIALSTRUCTURE('GUID-CN-1',$,$,$,(#10,#11,#12),#4);
#201=IFCRELCONTAINEDINSPATIALSTRUCTURE('GUID-CN-2',$,$,$,(#13,#14),#5);
#300=IFCCARTESIANPOINT((0.0,0.0,0.0));
#301=IFCCARTESIANPOINT((100.0,50.0,10.0));
ENDSEC;
END-ISO-10303-21;
"""


def test_parse_ifc_text_basic_summary() -> None:
    summary = parse_ifc_text(SAMPLE_IFC)
    assert summary.schema == "IFC4"
    assert summary.entity_total >= 6
    assert summary.entity_histogram.get("IFCCARTESIANPOINT", 0) == 3
    assert summary.has_project
    assert summary.has_site
    assert summary.has_building
    assert summary.has_storey
    assert summary.bbox.valid
    assert summary.bbox.min_x == -5.0
    assert summary.bbox.max_x == 10.0
    assert summary.bbox.max_y == 20.0
    assert summary.bbox.max_z == 5.0


def test_parse_ifc_stream_returns_same_summary() -> None:
    stream = io.BytesIO(SAMPLE_IFC.encode("utf-8"))
    summary = parse_ifc_stream(stream)
    assert summary.schema == "IFC4"
    assert summary.bbox.valid
    d = summary.as_dict()
    assert "entity_histogram" in d
    assert d["hierarchy"]["has_project"] is True


def test_parse_ifc_extracts_spatial_entities_with_globalid_and_name() -> None:
    """空間エンティティ (Project / Site / Building / Storey / Space) を
    GlobalId, Name, LongName 込みで抽出できる."""
    summary = parse_ifc_text(SAMPLE_IFC_DETAILED)

    spatial = summary.spatial_entities
    assert "IFCPROJECT" in spatial
    assert spatial["IFCPROJECT"][0]["global_id"] == "GUID-PRJ-0001"
    assert spatial["IFCPROJECT"][0]["name"] == "CDX Project"

    assert "IFCBUILDING" in spatial
    bldg = spatial["IFCBUILDING"][0]
    assert bldg["global_id"] == "GUID-BLDG-0001"
    assert bldg["name"] == "Office"
    assert bldg["long_name"] == "HeadOffice"

    storeys = spatial["IFCBUILDINGSTOREY"]
    assert len(storeys) == 2
    assert {s["name"] for s in storeys} == {"F1", "F2"}

    assert "IFCSPACE" in spatial
    assert spatial["IFCSPACE"][0]["long_name"] == "Meeting"


def test_parse_ifc_member_counts() -> None:
    """主要部材 (Wall/Slab/Beam/Column) の数を集計できる."""
    summary = parse_ifc_text(SAMPLE_IFC_DETAILED)
    mc = summary.member_counts
    assert mc.get("IFCWALL") == 2
    assert mc.get("IFCSLAB") == 1
    assert mc.get("IFCBEAM") == 1
    assert mc.get("IFCCOLUMN") == 1


def test_parse_ifc_builds_spatial_hierarchy_tree() -> None:
    """IFCRELAGGREGATES / IFCRELCONTAINEDINSPATIALSTRUCTURE から
    Project -> Site -> Building -> Storey -> {Space, 部材} のツリーを構築する."""
    summary = parse_ifc_text(SAMPLE_IFC_DETAILED)
    assert len(summary.hierarchy_tree) == 1
    project = summary.hierarchy_tree[0]
    assert project.type_name == "IFCPROJECT"
    # Project -> Site
    assert len(project.children) == 1
    site = project.children[0]
    assert site.type_name == "IFCSITE"
    # Site -> Building
    assert len(site.children) == 1
    building = site.children[0]
    assert building.type_name == "IFCBUILDING"
    # Building -> Storey x 2
    storey_types = [c.type_name for c in building.children]
    assert storey_types.count("IFCBUILDINGSTOREY") == 2

    # F1 storey に含まれる Space + 部材 (Wall/Slab)
    f1 = next(c for c in building.children if c.name == "F1")
    f1_child_types = {c.type_name for c in f1.children}
    assert "IFCSPACE" in f1_child_types
    assert "IFCWALL" in f1_child_types
    assert "IFCSLAB" in f1_child_types

    # as_dict が JSON シリアライズ可能な dict を返す
    d = summary.as_dict()
    assert d["member_counts"]["IFCWALL"] == 2
    assert d["hierarchy_tree"][0]["type"] == "IFCPROJECT"
    assert isinstance(d["spatial_entities"]["IFCBUILDING"], list)
