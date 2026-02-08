import { getEarliestCancellationDate } from "@/lib/cancellation-utils";
import { createCancellationSchema } from "@/lib/cancellation-schema";

// Mock the validateEmail server action
jest.mock("@/app/actions/validate-email", () => ({
    validateEmail: jest.fn().mockResolvedValue({ isValid: true })
}));

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
                    date_required_specific: "Date missing"
                }
            }
        };

        it("should validate a correct form data", async () => {
            const schema = createCancellationSchema(mockT);
            const validData = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "asap"
            };
            const result = await schema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });

        it("should fail if email is invalid", async () => {
            const schema = createCancellationSchema(mockT);
            const invalidData = {
                fullName: "John Doe",
                email: "not-an-email",
                terminationDate: "asap"
            };
            const result = await schema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Email error");
            }
        });

        it("should fail if specific date is selected but no date provided", async () => {
            const schema = createCancellationSchema(mockT);
            const invalidData = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "specific_date"
            };
            const result = await schema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Date missing");
            }
        });

        it("should fail if specific date is incomplete", async () => {
            const schema = createCancellationSchema(mockT);
            const invalidData = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "specific_date",
                specificDate: "02.." // Incomplete date
            };
            const result = await schema.safeParseAsync(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe("Date missing");
            }
        });

        it("should validate successfully with specific date", async () => {
            const schema = createCancellationSchema(mockT);
            const validData = {
                fullName: "John Doe",
                email: "john@example.com",
                terminationDate: "specific_date",
                specificDate: "01.01.2025"
            };
            const result = await schema.safeParseAsync(validData);
            expect(result.success).toBe(true);
        });
    });
});
