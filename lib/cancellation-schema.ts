import { z } from "zod";

export const cancellationSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    courseName: z.string().optional(),
    terminationDate: z.enum(["asap", "specific_date"]),
    specificDate: z.string().optional(), // In case they pick a date
}).refine((data) => {
    if (data.terminationDate === "specific_date" && !data.specificDate) {
        return false;
    }
    return true;
}, {
    message: "Date is required when specific date is selected",
    path: ["specificDate"],
});

export type CancellationFormData = z.infer<typeof cancellationSchema>;
