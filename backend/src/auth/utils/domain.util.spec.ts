import { isDomainAllowed } from './domain.util';

describe('domain.util', () => {
  describe('isDomainAllowed', () => {
    it('returns false if email or allowedDomainsRaw is empty', () => {
      expect(isDomainAllowed('', 'gmail.com')).toBe(false);
      expect(isDomainAllowed('test@gmail.com', '')).toBe(false);
      expect(isDomainAllowed('', '')).toBe(false);
    });

    it('returns false if email has no domain', () => {
      expect(isDomainAllowed('testgmail.com', 'gmail.com')).toBe(false);
    });

    it('allows exact domain matches', () => {
      expect(isDomainAllowed('user@gmail.com', 'gmail.com')).toBe(true);
      expect(isDomainAllowed('user@company.com', 'gmail.com, company.com')).toBe(true);
    });

    it('allows wildcard subdomains', () => {
      const allowed = 'gmail.com, *.company.com';
      expect(isDomainAllowed('user@ar.company.com', allowed)).toBe(true);
      expect(isDomainAllowed('user@br.company.com', allowed)).toBe(true);
      expect(isDomainAllowed('user@company.com', allowed)).toBe(true);
    });

    it('rejects unallowed domains', () => {
      const allowed = 'gmail.com, *.company.com';
      expect(isDomainAllowed('user@yahoo.com', allowed)).toBe(false);
      expect(isDomainAllowed('user@company.com.ar', allowed)).toBe(false);
      expect(isDomainAllowed('user@fake-company.com', allowed)).toBe(false);
    });

    it('handles spaces and casing properly', () => {
      const allowed = ' GMAIL.COM , *.Company.com ';
      expect(isDomainAllowed('user@gmail.com', allowed)).toBe(true);
      expect(isDomainAllowed('user@AR.COMPANY.COM', allowed)).toBe(true);
    });
  });
});
