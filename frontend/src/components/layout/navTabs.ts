export function getNavTabs(isAdmin: boolean): string[] {
  const tabs = ['/', '/orders/new'];
  if (isAdmin) tabs.push('/settings');
  return tabs;
}

export function getActiveTabPath(pathname: string, tabs: string[]): string | undefined {
  if (pathname === '/') return '/';
  const match = tabs
    .filter((p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')))
    .sort((a, b) => b.length - a.length)[0];
  if (match) return match;
  if (pathname.startsWith('/orders/')) return '/';
  return undefined;
}
