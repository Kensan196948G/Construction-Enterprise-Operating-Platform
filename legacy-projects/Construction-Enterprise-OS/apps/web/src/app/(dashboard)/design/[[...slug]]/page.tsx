import type { ComponentType } from "react";
import { DesignMockPage } from "../../_components/DesignMockPage";
import { FieldDesignView } from "../../_components/design/FieldDesignView";
import { DocumentsDesignView } from "../../_components/design/DocumentsDesignView";
import { IoTDesignView } from "../../_components/design/IoTDesignView";
import { ERPDesignView } from "../../_components/design/ERPDesignView";
import { PartnerDesignView } from "../../_components/design/PartnerDesignView";
import { GISDesignView } from "../../_components/design/GISDesignView";
import { WorkflowDesignView } from "../../_components/design/WorkflowDesignView";
import { SecurityDesignView } from "../../_components/design/SecurityDesignView";
import { RoboticsDesignView } from "../../_components/design/RoboticsDesignView";
import { SystemDesignView } from "../../_components/design/SystemDesignView";
import { CommonDesignView } from "../../_components/design/CommonDesignView";
import { AIDesignView } from "../../_components/design/AIDesignView";

// Category views: faithful across every sub-item — the component dispatches on
// `subPath` internally (tabs), so it renders for all items in the category.
const FAITHFUL_CATEGORY: Record<string, ComponentType<{ subPath?: string }>> = {
  field: FieldDesignView,
  common: CommonDesignView,
  partner: PartnerDesignView,
  documents: DocumentsDesignView,
  gis: GISDesignView,
  iot: IoTDesignView,
  ai: AIDesignView,
  workflow: WorkflowDesignView,
  security: SecurityDesignView,
  robotics: RoboticsDesignView,
  system: SystemDesignView,
  erp: ERPDesignView,
};

export default function DesignPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ?? [];
  const [category = "dashboard", item = "all"] = slug;

  const CategoryView = FAITHFUL_CATEGORY[category];
  if (CategoryView) {
    // Pass the full path (e.g. "/common/auth/entra") so the view can select
    // its internal tab; works for both 2- and 3-segment sidebar links.
    return <CategoryView subPath={slug.length ? `/${slug.join("/")}` : `/${category}`} />;
  }

  return <DesignMockPage category={category} item={item} />;
}
