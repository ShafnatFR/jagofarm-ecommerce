import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#FAFBFB]">
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-8" aria-label="Account navigation">
          <ul className="flex flex-wrap gap-4 border-b border-emerald-100 pb-4">
            {[
              { href: "/account", label: "Profil", icon: "person" },
              { href: "/account/addresses", label: "Alamat", icon: "location_on" },
              { href: "/wishlist", label: "Wishlist", icon: "favorite" },
              { href: "/orders", label: "Pesanan", icon: "inventory_2" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent hover:border-primary">
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