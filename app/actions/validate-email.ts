"use server";

import dns from "dns";
import util from "util";

const resolveMx = util.promisify(dns.resolveMx);

export async function validateEmail(email: string): Promise<{ isValid: boolean }> {
    try {
        const domain = email.split("@")[1];
        if (!domain) return { isValid: false };

        const addresses = await resolveMx(domain);
        return { isValid: addresses && addresses.length > 0 };
    } catch (error) {
        // If query fails (ENODATA, ENOTFOUND), domain is invalid
        return { isValid: false };
    }
}
