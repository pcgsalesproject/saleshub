import SalesAdminProfile from "@/components/SalesAdminProfile";

export default async function AdminMTProfilePage(props: PageProps<"/sales-admin/mt/[id]">) {
  const { id } = await props.params;
  return <SalesAdminProfile id={Number(id)} teamTag="Admin MT" teamHref="/sales-admin/mt" />;
}
