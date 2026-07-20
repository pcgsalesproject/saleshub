import SalesAdminProfile from "@/components/SalesAdminProfile";

export default async function SystemAdminProfilePage(props: PageProps<"/sales-admin/system/[id]">) {
  const { id } = await props.params;
  return <SalesAdminProfile id={Number(id)} teamTag="System Admin" teamHref="/sales-admin/system" />;
}
