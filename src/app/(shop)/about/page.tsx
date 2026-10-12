export const metadata = { title: "Tentang Kami - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("about");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
