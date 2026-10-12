export const metadata = { title: "Kebijakan Pengembalian - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("return-policy");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
