import { notFound } from "next/navigation";
import { z } from "zod";
import { CustomerApp } from "@/src/features/customer/customer-app";
export default async function Page({ params }: { params: Promise<{ id_customer: string }> }) {
  const { id_customer } = await params;
  if (!z.string().uuid().safeParse(id_customer).success) notFound();
  return <CustomerApp key={id_customer} id={id_customer} />;
}
