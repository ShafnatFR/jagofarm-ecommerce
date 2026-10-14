export const metadata = { title: "FAQ", alternates: { canonical: "/faq" } };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("faq");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
