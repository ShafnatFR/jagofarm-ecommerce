export const metadata = { title: "FAQ - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("faq");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
