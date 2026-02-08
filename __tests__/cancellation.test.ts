import { getEarliestCancellationDate } from "@/lib/cancellation-utils";
import { createCancellationSchema } from "@/lib/cancellation-schema";

describe("Cancellation Logic", () => {
    describe("getEarliestCancellationDate", () => {
        it("should return end of current month if date is <= 25th", () => {
            // Test 10th Feb 2024 (Leap year)
            const input = new Date(2024, 1, 10); // Feb is month 1
            const result = getEarliestCancellationDate(input);
            // Expect 29th Feb 2024
            expect(result.getDate()).toBe(29);
            expect(result.getMonth()).toBe(1);
            expect(result.getFullYear()).toBe(2024);
        });

        it("should return end of current month if date is exactly 25th", () => {
            // Test 25th March 2024
            const input = new Date(2024, 2, 25);
            const result = getEarliestCancellationDate(input);
            // Expect 31st March 2024
            expect(result.getDate()).toBe(31);
            expect(result.getMonth()).toBe(2);
        });

        it("should return end of NEXT month if date is > 25th", () => {
            // Test 26th Jan 2024
            const input = new Date(2024, 0, 26);
            const result = getEarliestCancellationDate(input);
            // Expect End of Feb (29th)
            expect(result.getDate()).toBe(29);
            expect(result.getMonth()).toBe(1);
        });

        it("should handle year rollover correctly", () => {
            // Test 26th Dec 2023
            const input = new Date(2023, 11, 26);
            const result = getEarliestCancellationDate(input);
            // Expect End of Jan 2024
            expect(result.getDate()).toBe(31);
            expect(result.getMonth()).toBe(0);
            expect(result.getFullYear()).toBe(2024);
        });
    });

    describe("Schema Validation", () => {
        const mockT = {
            cancellation: {
                errors: {
                    name_required: "Name error",
                    email_invalid: "Email error",
                    date_required_specific: "Date error"
                }
            }
        };
        const schema = createCancellationSchema(mockT);

        it("should validate correct data", () => {
            const data = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "asap" as const
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it("should validate specific date correctly", () => {
            const data = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "specific_date" as const,
                specificDate: "31.12.2024"
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it("should fail if specific date is missing when required", () => {
            const data = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "specific_date" as const
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Date error");
            }
        });

        it("should fail with invalid email", () => {
            const data = {
                fullName: "John Doe",
                email: "not-an-email",
                terminationDate: "asap" as const
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Email error");
            }
        });
    });
});
