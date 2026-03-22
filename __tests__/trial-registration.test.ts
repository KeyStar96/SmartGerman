import { submitTrialLesson } from "../app/actions/submit-trial";
import { checkTrialEligibility } from "../app/actions/check-trial-eligibility";
import { createAdminClient } from "@/utils/supabase/admin";

// Mock the Supabase client creator
jest.mock("@/utils/supabase/admin", () => ({
    createAdminClient: jest.fn(),
}));

// Provide a way to control rate limit response in tests
let mockRateLimitSuccess = true;
jest.mock("@/lib/ratelimit", () => ({
    rateLimit: jest.fn().mockImplementation(() => {
        return Promise.resolve({ success: mockRateLimitSuccess, limit: 10, remaining: 9, reset: 0 });
    })
}));

// Mock next/headers
jest.mock("next/headers", () => ({
    headers: () => ({
        get: (key: string) => {
            if (key === "x-forwarded-for") return "127.0.0.1";
            return null;
        }
    })
}));

describe("Trial Registration Logic", () => {
    // --- Shared Spies ---
    const mockSelect = jest.fn();
    const mockInsert = jest.fn();
    const mockFrom = jest.fn();

    // Chains for Select
    const mockIlikeEmail = jest.fn();
    const mockIlikeFirstName = jest.fn();
    const mockIlikeLastName = jest.fn();
    const mockLimit = jest.fn();

    const mockSupabase = {
        from: mockFrom,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockRateLimitSuccess = true;

        (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);

        mockFrom.mockImplementation((table) => {
            if (table === "trial_lessons") {
                return {
                    select: mockSelect,
                    insert: mockInsert
                };
            }
            return { select: jest.fn() };
        });

        // Default chain for select: select -> ilike -> ilike -> ilike -> limit -> resolve
        mockSelect.mockReturnValue({ ilike: mockIlikeEmail });
        mockIlikeEmail.mockReturnValue({ ilike: mockIlikeFirstName });
        mockIlikeFirstName.mockReturnValue({ ilike: mockIlikeLastName });
        mockIlikeLastName.mockReturnValue({ limit: mockLimit });

        // Default: No existing trial (eligible)
        mockLimit.mockResolvedValue({ data: [], error: null });

        // Default: Insert succeeds
        mockInsert.mockResolvedValue({ error: null });
    });

    describe("checkTrialEligibility", () => {
        it("should return eligible=true if no active trial exists", async () => {
            // Data is empty
            const result = await checkTrialEligibility("test@example.com", "Test", "User");
            expect(result.eligible).toBe(true);
            expect(mockFrom).toHaveBeenCalledWith("trial_lessons");
            expect(mockSelect).toHaveBeenCalledWith("id");
            expect(mockIlikeEmail).toHaveBeenCalledWith("email", "test@example.com");
        });

        it("should return eligible=false if an active trial exists", async () => {
            // Mock finding existing trial
            mockLimit.mockResolvedValue({ data: [{ id: "existing-trial-123" }], error: null });
            const result = await checkTrialEligibility("test@example.com", "Test", "User");
            expect(result.eligible).toBe(false);
        });

        it("should return eligible=true if an error occurs (fail open)", async () => {
            // Mock DB error
            mockLimit.mockResolvedValue({ data: null, error: { message: "DB Error" } });
            const result = await checkTrialEligibility("test@example.com", "Test", "User");
            expect(result.eligible).toBe(true);
        });

        it("should return eligible=true immediately if required fields are missing", async () => {
            // Missing email domain
            const result = await checkTrialEligibility("test", "Test", "User");
            expect(result.eligible).toBe(true);
            expect(mockFrom).not.toHaveBeenCalled();
        });
    });

    describe("submitTrialLesson", () => {
        const mockFormData = {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            courseId: "c_a1_1",
            trialDate: "2026-03-01",
            phone: "+49123456"
        };

        it("should succeed for a valid new trial request", async () => {
            const result = await submitTrialLesson(mockFormData);

            expect(result.success).toBe(true);
            expect(result.message).toBe("trial_success");

            // Should check existing
            expect(mockLimit).toHaveBeenCalledWith(1);

            // Should insert
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                email: "john@example.com",
                first_name: "John",
                last_name: "Doe",
                course_id: "c_a1_1",
                trial_date: "2026-03-01",
                status: "pending"
            }));
        });

        it("should fail and return trial_already_used if check finds existing record", async () => {
            mockLimit.mockResolvedValue({ data: [{ id: "existing" }], error: null });

            const result = await submitTrialLesson(mockFormData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("trial_already_used");

            // Insert should NOT be called
            expect(mockInsert).not.toHaveBeenCalled();
        });

        it("should return rate limit error if too many requests", async () => {
            mockRateLimitSuccess = false; // Simulate rate limit hit

            const result = await submitTrialLesson(mockFormData);

            expect(result.success).toBe(false);
            expect(result.message).toContain("Too many requests");
            expect(mockFrom).not.toHaveBeenCalled(); // DB not touched
        });

        it("should return validation error if required fields are missing", async () => {
            const result = await submitTrialLesson({
                ...mockFormData,
                courseId: "" // Missing courseId
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain("Missing required fields");
            expect(mockFrom).not.toHaveBeenCalled(); // DB not touched
        });

        it("should handle unique constraint violation on insert gracefully", async () => {
            // Sometimes the initial check passes due to race conditions, but insert fails on unique constraint
            mockInsert.mockResolvedValue({ error: { code: '23505', message: "Unique violation" } });

            const result = await submitTrialLesson(mockFormData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("trial_already_used"); // Catches it specific handling
        });

        it("should return generic insert error on other DB failures", async () => {
            mockInsert.mockResolvedValue({ error: { code: 'other', message: "Random DB Error" } });

            const result = await submitTrialLesson(mockFormData);

            expect(result.success).toBe(false);
            expect(result.message).toBe("trial_insert_failed");
        });
    });
});
