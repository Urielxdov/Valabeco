"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  LineChart,
  BookOpen,
  ScrollText,
  Users,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Gestión comercial",
    items: [{ label: "Clientes", href: "/clientes", icon: Users }],
  },
  {
    title: "Contabilidad",
    items: [
      { label: "Resumen", href: "/", icon: LayoutDashboard, exact: true },
      { label: "Plan de cuentas", href: "/accounts", icon: BookOpen },
      { label: "Asientos", href: "/transactions/new", icon: FileText },
      { label: "Libro mayor", href: "/ledger", icon: Landmark },
      { label: "Detalle", href: "/transactions", icon: BadgeCheck },
    ],
  },
  {
    title: "Estructura organizacional",
    items: [
      { label: "Mapa del módulo", href: "/organizacion", icon: LayoutDashboard, exact: true },
      { label: "Puestos", href: "/organizacion/puestos", icon: Briefcase },
      { label: "Posiciones", href: "/organizacion/posiciones", icon: Users },
      { label: "Bitácora de auditoría", href: "/organizacion/auditoria", icon: ScrollText },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const LogoIcon = LineChart;

  return (
    <aside className="bg-slate-950 px-5 py-6 text-white">
      <div className="mb-10 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-500">
          <LogoIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold">Edeco</p>
          <p className="text-xs text-slate-400">ERP</p>
        </div>
      </div>

      <nav className="space-y-5 text-sm">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item);

                return (
                  <Link
                    className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left ${
                      active
                        ? "bg-teal-600 text-white"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-16 border-t border-slate-800 pt-5 text-xs text-slate-400">
        <p className="font-semibold text-white">Maria Jimenez</p>
        <p>Empresa Demo</p>
      </div>
    </aside>
  );
}
