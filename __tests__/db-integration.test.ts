
import { getCourses } from "../app/actions/get-courses";
import { submitEnrollment } from "../app/actions/submit-enrollment";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Mock the Supabase client creator
jest.mock("@/utils/supabase/server", () => ({
    createClient: jest.fn(),
}));
jest.mock("@/utils/supabase/admin", () => ({
    createAdminClient: jest.fn(),
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

    // Users Table Mocks
    const mockUserSelect = jest.fn();
    const mockUserEq1 = jest.fn(); // eq first_name
    const mockUserEq2 = jest.fn(); // eq last_name
    const mockUserEq3 = jest.fn(); // eq birth_date
    const mockUserLimit = jest.fn();

    // User Insert
    const mockUserInsert = jest.fn();
    const mockUserInsertSingle = jest.fn();
    const mockUserInsertSelect = jest.fn();

    // User Update
    const mockUserUpdate = jest.fn();
    const mockUserUpdateEq = jest.fn();

    // From Mock
    const mockFrom = jest.fn();

    const mockSupabase = {
        from: mockFrom,
    };

    // ... (inside describe) ...

    beforeEach(() => {
        jest.clearAllMocks();
        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
        (createAdminClient as jest.Mock).mockReturnValue(mockSupabase);

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
            if (table === "users") {
                return {
                    select: mockUserSelect,
                    insert: mockUserInsert,
                    update: mockUserUpdate
                };
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

        // 4. Users Select Chain: select -> eq -> eq -> eq -> limit
        mockUserSelect.mockReturnValue({ eq: mockUserEq1 });
        mockUserEq1.mockReturnValue({ eq: mockUserEq2 });
        mockUserEq2.mockReturnValue({ eq: mockUserEq3 });
        mockUserEq3.mockReturnValue({ limit: mockUserLimit });

        // Default: No existing user found (Simulate new user flow)
        mockUserLimit.mockResolvedValue({ data: [], error: null });

        // 5. Users Insert Chain: insert -> select -> single
        mockUserInsert.mockReturnValue({ select: mockUserInsertSelect });
        mockUserInsertSelect.mockReturnValue({ single: mockUserInsertSingle });
        mockUserInsertSingle.mockResolvedValue({ data: { id: "mock-new-user-id" }, error: null });

        // 6. Users Update Chain: update -> eq
        mockUserUpdate.mockReturnValue({ eq: mockUserUpdateEq });
        mockUserUpdateEq.mockResolvedValue({ error: null });
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

        it("should create new user and insert registration correctly", async () => {
            const result = await submitEnrollment(
                mockFormData as any,
                ["c_1", "c_2"],
                "0-2026", // Jan 2026
                500,
                { privacy: true, agb: true, revocation: true }
            );

            expect(result.success).toBe(true);

            // 1. Verify User Check
            expect(mockFrom).toHaveBeenCalledWith("users");
            expect(mockUserSelect).toHaveBeenCalledWith("id"); // Checking existence
            expect(mockUserLimit).toHaveBeenCalledWith(1);

            // 2. Verify User Creation (since finding returned [])
            expect(mockUserInsert).toHaveBeenCalledWith(expect.objectContaining({
                first_name: "Max",
                last_name: "Mustermann",
                birth_date: "01.01.1990",
                email: "max@example.com"
            }));

            // 3. Verify Registration Insert Linked to NEW User
            expect(mockFrom).toHaveBeenCalledWith("registrations");
            expect(mockRegInsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: "mock-new-user-id", // Linked!
                start_date: "2026-01-01",
                total_price: 500
            }));

            // 4. Verify Enrollment Insert
            expect(mockFrom).toHaveBeenCalledWith("enrollments");
            expect(mockEnrollInsert).toHaveBeenCalledWith([
                { registration_id: "mock-reg-uuid", course_id: "c_1" },
                { registration_id: "mock-reg-uuid", course_id: "c_2" }
            ]);
        });

        it("should identify returning user and Link Registration (Deduplication)", async () => {
            // Mock finding a user (Name+DOB match)
            mockUserLimit.mockResolvedValue({ data: [{ id: "existing-user-id" }], error: null });

            const result = await submitEnrollment(
                mockFormData as any,
                ["c_1"],
                "0-2026",
                100,
                { privacy: true, agb: true, revocation: true }
            );

            expect(result.success).toBe(true);

            // 1. Verify NO NEW User Created
            expect(mockUserInsert).not.toHaveBeenCalled();

            // 2. Verify Registration Linked to EXISTING ID
            expect(mockRegInsert).toHaveBeenCalledWith(expect.objectContaining({
                user_id: "existing-user-id", // The critical check
                total_price: 100
            }));
        });

        it("should UPDATE contact info for returning user", async () => {
            // Mock finding a user
            mockUserLimit.mockResolvedValue({ data: [{ id: "existing-user-id" }], error: null });

            // Simulate NEW contact info in the form
            const updatedFormData = {
                ...mockFormData,
                personal: {
                    ...mockFormData.personal,
                    email: "new-email@example.com",
                    city: "Munich",
                    street: "New Street 1"
                }
            };

            const result = await submitEnrollment(
                updatedFormData as any,
                ["c_1"],
                "0-2026",
                100,
                { privacy: true, agb: true, revocation: true }
            );

            expect(result.success).toBe(true);

            // Verify UPDATE called with NEW data
            expect(mockUserUpdate).toHaveBeenCalledWith(expect.objectContaining({
                email: "new-email@example.com",
                city: "Munich",
                street: "New Street 1"
            }));

            // Verify Update targeted correct user
            expect(mockUserUpdateEq).toHaveBeenCalledWith("id", "existing-user-id");
        });

        it("should handle Registration Table failure", async () => {
            mockRegSingle.mockResolvedValue({ data: null, error: { message: "Reg failed" } });

            const result = await submitEnrollment(mockFormData as any, ["c_1"], "0-2026", 100, { privacy: true, agb: true, revocation: true });

            expect(result.success).toBe(false);
            expect(result.message).toContain("Registration failed");
            expect(mockEnrollInsert).not.toHaveBeenCalled(); // Should stop before enrolling
        });

        it("should handle Enrollment Table failure", async () => {
            // Reg succeeds
            mockRegSingle.mockResolvedValue({ data: { id: "mock-reg-uuid" }, error: null });
            // Enrollment fails
            mockEnrollInsert.mockResolvedValue({ error: { message: "Enroll fail" } });

            const result = await submitEnrollment(mockFormData as any, ["c_1"], "0-2026", 100, { privacy: true, agb: true, revocation: true });

            expect(result.success).toBe(false);
            expect(result.message).toContain("Enrollment details failed");
        });
    });
});
