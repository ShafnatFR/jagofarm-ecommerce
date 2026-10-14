export const metadata = { title: "Cara Pemesanan", alternates: { canonical: "/how-to-order" } };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("how-to-order");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
