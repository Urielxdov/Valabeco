import { OrganizationApp } from "@/src/features/organization/organization-app";

export default async function PositionDetailPage({
  params,
}: PageProps<"/organizacion/posiciones/[id_position]">) {
  const { id_position: idPosition } = await params;

  return <OrganizationApp initialPositionId={idPosition} initialView="posicion" />;
}
