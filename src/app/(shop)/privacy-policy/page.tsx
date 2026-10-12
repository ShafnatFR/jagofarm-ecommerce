export const metadata = { title: "Kebijakan Privasi - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("privacy-policy");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
