export const metadata = { title: "Cara Pemesanan - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("how-to-order");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
