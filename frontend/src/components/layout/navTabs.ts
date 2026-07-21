export function getNavTabs(isAdmin: boolean): string[] {
  const tabs = ['/', '/orders', '/orders/new'];
  if (isAdmin) tabs.push('/settings');
  return tabs;
}

export function getActiveTabPath(pathname: string, tabs: string[]): string | undefined {
  if (pathname === '/') return '/';
  return tabs
    .filter((p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')))
    .sort((a, b) => b.length - a.length)[0];
}
