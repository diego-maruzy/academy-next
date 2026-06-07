import {
  BookOpen,
  Cable,
  Clapperboard,
  CreditCard,
  LayoutDashboard,
  Mail,
  Settings,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminPermission } from "@/lib/admin-auth/permissions";

export type SidebarGroup = "navigation" | "management" | "administration";

export const SIDEBAR_GROUP_LABELS: Record<SidebarGroup, string> = {
  navigation: "Navegação",
  management: "Gestão",
  administration: "Administração",
};

export const SIDEBAR_GROUP_ORDER: SidebarGroup[] = [
  "navigation",
  "management",
  "administration",
];

export type SidebarItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  group: SidebarGroup;
  allowedPermissions: AdminPermission[];
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "navigation",
    allowedPermissions: ["admin_access", "academy_access", "support_access"],
  },
  {
    title: "Programas",
    href: "/programas",
    icon: BookOpen,
    group: "navigation",
    allowedPermissions: ["admin_access", "academy_access"],
  },
  {
    title: "Gestão de conteúdo",
    href: "/admin/programas",
    icon: BookOpen,
    group: "management",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "Reels",
    href: "/admin/shorts",
    icon: Clapperboard,
    group: "management",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    group: "management",
    allowedPermissions: ["admin_access", "academy_access", "support_access"],
  },
  {
    title: "Equipe",
    href: "/equipe",
    icon: UserCog,
    group: "management",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "Administrador",
    href: "/administrador",
    icon: Shield,
    group: "administration",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "Pagamentos",
    href: "/pagamentos",
    icon: CreditCard,
    group: "administration",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "E-mails",
    href: "/admin/emails",
    icon: Mail,
    group: "administration",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "Conexões",
    href: "/conexoes",
    icon: Cable,
    group: "administration",
    allowedPermissions: ["admin_access"],
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    group: "administration",
    allowedPermissions: ["admin_access"],
  },
];
