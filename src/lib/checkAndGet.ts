import { Address4, Address6 } from "ip-address";

export const convertIP = (ip: string): string | null => {
  try {
    // First check if it's a valid IPv4
    const ipv4 = new Address4(ip);
    if (Address4.isValid(ip)) {
      return ipv4.correctForm();
    }
  } catch (error) {
    // Not a valid IPv4, continue to check IPv6
  }

  try {
    const ipv6 = new Address6(ip);
    if (Address6.isValid(ip)) {
      if (ipv6.is4()) {
        return ipv6.to4().correctForm();
      }
    }
  } catch (error: any) {
     console.log(error.message)
  }

  return null;
};

