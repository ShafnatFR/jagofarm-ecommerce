export const metadata = { title: "Kebijakan Privasi", alternates: { canonical: "/privacy-policy" } };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("privacy-policy");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
