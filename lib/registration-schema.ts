import * as z from "zod";
import { validateEmail } from "@/app/actions/validate-email";

// Stricter Phone Regex:
// 1. Must contain at least 8 digits (standard landline/mobile usually has area code + number >= 8)
// 2. Allowed chars: digits, spaces, +, -, (, ), /
// 3. Min length overall 8
// 4. Must start with + or digit or (
export const phoneRegex = /^(?=(?:[^0-9]*[0-9]){8})[\d\s\+\-\(\)\/]{8,}$/;

export const createSchema = (t: any) => z.object({
    personal: z.object({
        firstName: z.string().min(2, t.registration.errors.firstname_required),
        lastName: z.string().min(2, t.registration.errors.lastname_required),
        email: z.string().email(t.registration.errors.email_invalid)
            // Extra strictness: No double dots
            .refine(val => !val.includes(".."), t.registration.errors.email_invalid || "Invalid Format")
            .refine(async (email) => {
                const { isValid } = await validateEmail(email);
                return isValid;
            }, t.registration.errors.email_domain_invalid || "Invalid Domain"),
        phone: z.string().trim().refine((val) => val === "" || phoneRegex.test(val), t.registration.errors.phone_invalid).optional(),
        street: z.string().min(3, t.registration.errors.street_required),
        zip: z.string().length(5, t.registration.errors.zip_length).regex(/^\d+$/, t.registration.errors.zip_numeric),
        city: z.string().min(2, t.registration.errors.city_required),
        birthDate: z.string().min(1, t.registration.errors.birthdate_required).regex(/^\d{2}\.\d{2}\.\d{4}$/, t.registration.errors.birthdate_incomplete || "Complete Date Required"),
    }),
});

export type EnrollmentFormData = z.infer<ReturnType<typeof createSchema>>;
