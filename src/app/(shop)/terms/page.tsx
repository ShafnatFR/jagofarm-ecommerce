export const metadata = { title: "Syarat dan Ketentuan - JagoFarm" };

import { getContentPageHtml } from "@/lib/content";

export default async function Page() {
  const html = await getContentPageHtml("terms");

  return (
    <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
  );
}
