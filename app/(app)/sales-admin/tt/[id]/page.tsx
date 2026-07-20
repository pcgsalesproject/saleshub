import SalesAdminProfile from "@/components/SalesAdminProfile";

export default async function AdminTTProfilePage(props: PageProps<"/sales-admin/tt/[id]">) {
  const { id } = await props.params;
  return <SalesAdminProfile id={Number(id)} teamTag="Admin TT" teamHref="/sales-admin/tt" />;
}
