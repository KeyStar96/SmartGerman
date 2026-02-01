
import { getCourses } from "../app/actions/get-courses";
import { submitEnrollment } from "../app/actions/submit-enrollment";
import { createClient } from "@/utils/supabase/server";

// Mock the Supabase client creator
jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));

describe("Database Integration Tests (Mocked)", () => {
    // --- Shared Spies ---
    const mockSelect = jest.fn();

    // Reg Table Mocks
    const mockRegSingle = jest.fn();
    const mockRegSelect = jest.fn();
    const mockRegInsert = jest.fn();

    // Enrollment Table Mocks
    const mockEnrollInsert = jest.fn();

    // From Mock
    const mockFrom = jest.fn();

    const mockSupabase = {
        from: mockFrom,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (createClient as jest.Mock).mockResolvedValue(mockSupabase);

        // SETUP DEFAULT BEHAVIOR
        mockFrom.mockImplementation((table) => {
            if (table === "courses") {
                return { select: mockSelect };
            }
            if (table === "registrations") {
                return { insert: mockRegInsert };
            }
            if (table === "enrollments") {
                return { insert: mockEnrollInsert };
            }
            return { select: jest.fn() };
        });

        // Default Valid Responses
        // 1. Courses
        mockSelect.mockReturnValue(Promise.resolve({ data: [], error: null })); // Default empty

        // 2. Registration Chain: insert -> select -> single
        mockRegInsert.mockReturnValue({ select: mockRegSelect });
        mockRegSelect.mockReturnValue({ single: mockRegSingle });
        mockRegSingle.mockResolvedValue({ data: { id: "mock-reg-uuid" }, error: null });

        // 3. Enrollments Chain: insert -> Promise
        mockEnrollInsert.mockResolvedValue({ error: null });
    });

    describe("getCourses", () => {
        it("should fetch courses and transform snake_case to camelCase", async () => {
            const mockDbCourses = [
                {
                    id: "c_test_1",
                    translation_key: "key_1",
                    type: "presence",
                    price: 100,
                    sessions: [{ day: "Mo", startTime: "10:00", endTime: "12:00" }],
                    instructor: "standard",
                    unit_duration: 45
                }
            ];
            mockSelect.mockResolvedValue({ data: mockDbCourses, error: null });

            const result = await getCourses();

            expect(mockFrom).toHaveBeenCalledWith("courses");
            expect(mockSelect).toHaveBeenCalledWith("*");
            expect(result[0]).toMatchObject({
                id: "c_test_1",
                translationKey: "key_1",
                type: "presence",
                unitDuration: 45
            });
        });

        it("should return empty array on DB error", async () => {
            mockSelect.mockResolvedValue({ data: null, error: { message: "Fail" } });
            const result = await getCourses();
            expect(result).toEqual([]);
        });
    });

    describe("submitEnrollment", () => {
        const mockFormData = {
            personal: {
                firstName: "Max",
                lastName: "Mustermann",
                email: "max@example.com",
                phone: "+4912345678",
                street: "Teststr. 1",
                zip: "12345",
                city: "Berlin",
                birthDate: "01.01.1990"
            }
        };

        it("should insert registration and enrollments correctly", async () => {
            const result = await submitEnrollment(
                mockFormData as any,
                ["c_1", "c_2"],
                "0-2026", // Jan 2026
                500
            );

            expect(result.success).toBe(true);

            // 1. Verify Registration Insert
            expect(mockFrom).toHaveBeenCalledWith("registrations");
            expect(mockRegInsert).toHaveBeenCalledWith(expect.objectContaining({
                first_name: "Max",
                last_name: "Mustermann",
                start_date: "2026-01-01", // Derived from "0-2026"
                total_price: 500
            }));

            // 2. Verify Enrollment Insert
            expect(mockFrom).toHaveBeenCalledWith("enrollments");
            expect(mockEnrollInsert).toHaveBeenCalledWith([
                { registration_id: "mock-reg-uuid", course_id: "c_1" },
                { registration_id: "mock-reg-uuid", course_id: "c_2" }
            ]);
        });

        it("should handle Registration Table failure", async () => {
            mockRegSingle.mockResolvedValue({ data: null, error: { message: "Reg failed" } });

            const result = await submitEnrollment(mockFormData as any, ["c_1"], "0-2026", 100);

            expect(result.success).toBe(false);
            expect(result.message).toContain("Registration failed");
            expect(mockEnrollInsert).not.toHaveBeenCalled(); // Should stop before enrolling
        });

        it("should handle Enrollment Table failure", async () => {
            // Reg succeeds
            mockRegSingle.mockResolvedValue({ data: { id: "mock-reg-uuid" }, error: null });
            // Enrollment fails
            mockEnrollInsert.mockResolvedValue({ error: { message: "Enroll fail" } });

            const result = await submitEnrollment(mockFormData as any, ["c_1"], "0-2026", 100);

            expect(result.success).toBe(false);
            expect(result.message).toContain("Enrollment details failed");
        });
    });
});
