import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";

// Area akun bersifat privat — jangan diindeks mesin pencari.
export const metadata: Metadata = {
  title: "Akun Saya",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-8" aria-label="Account navigation">
          <ul className="flex flex-wrap items-center gap-2 border-b border-outline-variant pb-4">
            {[
              { href: "/account", label: "Profil", icon: "person" },
              { href: "/account/points", label: "Poin", icon: "stars" },
              { href: "/account/addresses", label: "Alamat", icon: "location_on" },
              { href: "/account/security", label: "Keamanan", icon: "shield" },
              { href: "/account/transactions", label: "Transaksi", icon: "receipt_long" },
              { href: "/wishlist", label: "Wishlist", icon: "favorite" },
              { href: "/orders", label: "Pesanan", icon: "inventory_2" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </div>
    </div>
  );
}