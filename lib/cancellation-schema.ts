import { z } from "zod";

export const createCancellationSchema = (t: any) => z.object({
    fullName: z.string().min(2, t?.cancellation?.errors?.name_required || "Name must be at least 2 characters"),
    email: z.string().email(t?.cancellation?.errors?.email_invalid || "Invalid email address"),
    courseName: z.string().optional(),
    terminationDate: z.enum(["asap", "specific_date"]),
    specificDate: z.string().optional(), // In case they pick a date
}).refine((data) => {
    if (data.terminationDate === "specific_date" && !data.specificDate) {
        return false;
    }
    return true;
}, {
    message: t?.cancellation?.errors?.date_required_specific || "Date is required when specific date is selected",
    path: ["specificDate"],
});

export type CancellationFormData = z.infer<ReturnType<typeof createCancellationSchema>>;
