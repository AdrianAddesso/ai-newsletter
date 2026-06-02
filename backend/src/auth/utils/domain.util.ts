export function isDomainAllowed(email: string, allowedDomainsRaw: string): boolean {
  if (!email || !allowedDomainsRaw) return false;

  let domain = email.split('@')[1];
  if (!domain) return false;
  domain = domain.toLowerCase();

  const allowedDomains = allowedDomainsRaw.split(',').map((d) => d.trim().toLowerCase());

  for (const allowed of allowedDomains) {
    if (allowed.startsWith('*.')) {
      const rootDomain = allowed.slice(2);
      if (domain === rootDomain || domain.endsWith(`.${rootDomain}`)) {
        return true;
      }
    } else {
      if (domain === allowed) {
        return true;
      }
    }
  }
  return false;
}
