import { OrganizationApp } from "@/src/features/organization/organization-app";

export default async function UserHistoryPage({
  params,
}: PageProps<"/organizacion/usuarios/[id_user]">) {
  const { id_user: idUser } = await params;

  return <OrganizationApp initialUserId={idUser} initialView="usuario" />;
}
