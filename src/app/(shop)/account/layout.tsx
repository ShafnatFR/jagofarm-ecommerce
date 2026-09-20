import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-8" aria-label="Account navigation">
          <ul className="flex flex-wrap gap-4 border-b border-border pb-4">
            <li>
              <Link
                href="/account"
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors border-b-2 border-transparent hover:border-primary"
              >
                Profil
              </Link>
            </li>
            <li>
              <Link
                href="/account/addresses"
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors border-b-2 border-transparent hover:border-primary"
              >
                Alamat
              </Link>
            </li>
          </ul>
        </nav>
        {children}
      </div>
    </div>
  );
}