/**
 * @jest-environment node
 */
import { submitEnrollment } from '@/app/actions/submit-enrollment';
import { createAdminClient } from '@/utils/supabase/admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly assuming we are running from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// MOCK HEADERS for server action - Must be top level to ensure hoisting works before imports
jest.mock("next/headers", () => ({
    headers: () => ({
        get: (key: string) => {
            if (key === "x-forwarded-for") return "127.0.0.1";
            return null;
        }
    })
}));

describe('Deep Integration: Real Database Operations', () => {
    // Increase timeout for real network calls
    jest.setTimeout(30000);

    const supabase = createAdminClient();
    let createdRegistrationId: string | null = null;
    let createdUserId: string | null = null;

    afterAll(async () => {
        // CLEANUP: Delete the test data
        if (createdRegistrationId) {
            await supabase.from('enrollments').delete().eq('registration_id', createdRegistrationId);
            await supabase.from('registrations').delete().eq('id', createdRegistrationId);
        }
        if (createdUserId) {
            // CAREFUL: Only delete if we are SURE it was created by us and is a test user
            await supabase.from('users').delete().eq('id', createdUserId);
        }
    });

    it('Should successfully Insert and Link (Health Check)', async () => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn("Skipping real DB test: SUPABASE_SERVICE_ROLE_KEY not found.");
            return;
        }

        const testUserEmail = `integration.test.${Date.now()}@example.com`;
        const testName = `IntTestUser_${Date.now()}`;

        const formData = {
            personal: {
                firstName: testName,
                lastName: "Tester",
                email: testUserEmail,
                phone: "+49123456789",
                street: "Test Street 1",
                zip: "12345",
                city: "Test City",
                birthDate: "01.01.2000" // Unique enough combined with timestamp name
            }
        };

        const selectedCourseIds = ["c_a1_1_50plus"]; // Must exist
        const startMonth = "01.02.2026"; // Correct format DD.MM.YYYY
        const totalPrice = 123.45;
        const coursePrices = { "c_a1_1_50plus": 123.45 }; // Missing arg

        // 1. EXECUTE ACTION
        const result = await submitEnrollment(
            formData as any,
            selectedCourseIds,
            startMonth,
            totalPrice,
            { privacy: true, agb: true, revocation: true },
            coursePrices
        );

        // 2. VERIFY SUCCESS
        if (!result.success) {
            throw new Error(`Real DB Integration Failed: ${result.message} - ${JSON.stringify(result.error)}`);
        }
        expect(result.success).toBe(true);

        // 3. VERIFY DATA (Double Check)
        // Find the user we just created/linked
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('first_name', testName)
            .limit(1);

        expect(userError).toBeNull();
        expect(users).toHaveLength(1);
        createdUserId = users![0].id;

        // Find the registration
        const { data: maxRegs, error: regError } = await supabase
            .from('registrations')
            .select('id, user_id, total_price')
            .eq('user_id', createdUserId)
            .order('created_at', { ascending: false })
            .limit(1);

        expect(regError).toBeNull();
        expect(maxRegs).toHaveLength(1);
        expect(maxRegs![0].total_price).toBe(totalPrice);
        createdRegistrationId = maxRegs![0].id;
    });
});
