export const metadata = { title: "Kebijakan Pengiriman - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("shipping-policy");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
