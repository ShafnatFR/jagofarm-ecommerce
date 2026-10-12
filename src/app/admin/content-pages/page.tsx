import { listContentPages } from "@/lib/content-pages";
import { requireAdminUser } from "@/lib/auth";
import ContentPageForm from "./content-page-form";

export const metadata = { title: "Halaman Konten Statis - Admin" };

export default async function ContentPagesAdminPage() {
  await requireAdminUser();
  const pages = await listContentPages();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-green-900">Halaman Konten Statis</h1>
        <p className="mt-1 text-sm text-green-700">
          Kelola halaman about, faq, dan policy yang di-render dari database.
        </p>
      </header>

      <section className="mb-8 border border-green-200 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-green-900 mb-4">Tambah Halaman</h2>
        <ContentPageForm initial={null} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-green-900">Daftar Halaman</h2>
        {pages.length === 0 ? (
          <p className="text-sm text-green-700">Belum ada halaman statis.</p>
        ) : (
          <ul className="divide-y divide-green-200">
            {pages.map((page) => (
              <li
                key={page.id}
                className="flex flex-wrap items-center gap-4 border-b border-green-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-green-900">{page.title}</div>
                  <div className="text-sm text-green-700">/{page.slug}</div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${page.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {page.isActive ? "Aktif" : "Nonaktif"}
                </span>
                <ContentPageForm initial={page} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
