'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type SidebarProps = {
  role: 'admin' | 'seller';
  userName: string;
};

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/inventory', label: 'Inventory', icon: '🗃️' },
  { href: '/admin/orders', label: 'Orders', icon: '📋' },
];

const SELLER_NAV: NavItem[] = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: '⚡' },
  { href: '/seller/products', label: 'Browse Products', icon: '🛍️' },
  { href: '/seller/cart', label: 'My Cart', icon: '🛒' },
  { href: '/seller/orders', label: 'My Orders', icon: '📋' },
];

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'admin' ? ADMIN_NAV : SELLER_NAV;
  const roleLabel = role === 'admin' ? 'Admin' : 'Seller';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-400))' }}
          >
            📦
          </div>
          <div>
            <div className="font-bold text-sm gradient-text">InventoryPro</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{roleLabel} Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div
        className="mx-3 p-3 rounded-xl"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid color-mix(in oklch, white 6%, transparent)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'var(--color-brand-700)', color: 'var(--color-brand-300)' }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{userName}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{roleLabel}</div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-secondary btn-sm w-full justify-center text-xs">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
