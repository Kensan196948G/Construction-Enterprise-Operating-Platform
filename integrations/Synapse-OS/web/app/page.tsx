import { getDashboard } from "@/lib/api";
import { DashboardContent } from "@/app/dashboard-content";
import { ServiceHealth } from "@/components/ServiceHealth";

async function fetchDashboard() {
  try {
    return await getDashboard();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await fetchDashboard();
  return (
    <>
      <DashboardContent data={data} />
      <ServiceHealth compact />
    </>
  );
}
