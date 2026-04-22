import { useCookies } from 'react-cookie';
const activeOrganization = 'activeOrganization';

export function useDecodedActiveUser(): string | undefined {
  const [cookies] = useCookies([activeOrganization]);
  return cookies[activeOrganization] || undefined;
}
