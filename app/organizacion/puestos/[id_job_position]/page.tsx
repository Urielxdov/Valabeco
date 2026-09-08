import { OrganizationApp } from "@/src/features/organization/organization-app";

export default async function JobPositionDetailPage({
  params,
}: PageProps<"/organizacion/puestos/[id_job_position]">) {
  const { id_job_position: idJobPosition } = await params;

  return <OrganizationApp initialJobId={idJobPosition} initialView="puesto" />;
}
