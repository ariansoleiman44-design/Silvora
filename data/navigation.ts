/**
 * NAVIGATION
 * --------------------------------------------------------------------
 * Header, mobile menu and footer link groups.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Optional short description used in the mobile menu. */
  hint?: string;
}

export const mainNav: NavLink[] = [
  { label: "Products", href: "/products", hint: "Bale formats & specifications" },
  { label: "Quality", href: "/quality", hint: "From crop to inspection" },
  { label: "Our Process", href: "/process", hint: "Field to feed in eight steps" },
  { label: "Logistics", href: "/logistics", hint: "Farm, commercial & export orders" },
  { label: "About", href: "/about", hint: "Why we do this" },
  { label: "Contact", href: "/contact", hint: "Talk to sales" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Products",
    links: [
      { label: "All bales", href: "/products" },
      { label: "Round bales", href: "/products?format=round" },
      { label: "Square bales", href: "/products?format=square" },
      { label: "Compact bales", href: "/products?format=compact" },
      { label: "Bulk & custom", href: "/products/bulk-custom-order" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Quality", href: "/quality" },
      { label: "Our process", href: "/process" },
      { label: "Logistics", href: "/logistics" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Find your bale", href: "/#finder" },
      { label: "Silage calculator", href: "/quote#calculator" },
      { label: "Compare formats", href: "/quality#compare" },
      { label: "FAQ", href: "/#faq" },
      { label: "Request a quote", href: "/quote" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
];
