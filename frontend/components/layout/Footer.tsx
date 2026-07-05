import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Cancellation Options", href: "/help/cancellation" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold text-text-primary">Stayzy</span>
          <p className="max-w-xs text-sm text-text-muted">
            Search, compare, and book hotels in one flow — no tab juggling.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <div key={group.heading} className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text-primary">{group.heading}</span>
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-muted transition-colors hover:text-text-secondary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-border-default px-6 py-5">
        <p className="mx-auto max-w-7xl text-xs text-text-faint">
          © {new Date().getFullYear()} Stayzy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
