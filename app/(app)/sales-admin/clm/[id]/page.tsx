import SalesAdminProfile from "@/components/SalesAdminProfile";

export default async function AdminCLMProfilePage(props: PageProps<"/sales-admin/clm/[id]">) {
  const { id } = await props.params;
  return <SalesAdminProfile id={Number(id)} teamTag="Admin CLM" teamHref="/sales-admin/clm" />;
}
