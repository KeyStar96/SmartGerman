
import { submitEnrollment } from '@/app/actions/submit-enrollment';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

describe('Manual Debug Integration', () => {
    // Increase timeout for real DB calls
    jest.setTimeout(30000);

    it('submits enrollment to real database', async () => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn("Skipping real DB test: SUPABASE_SERVICE_ROLE_KEY not found.");
            return;
        }

        const formData = {
            personal: {
                firstName: "DebugJest",
                lastName: "User",
                email: "debug.jest@example.com",
                phone: "+49123456789",
                street: "Debug Street 1",
                zip: "12345",
                city: "Debug City",
                birthDate: "01.01.1990"
            }
        };

        const selectedCourseIds = ["c_a1_1_50plus"]; // Ensure this ID exists
        const startMonth = "0-2026";
        const totalPrice = 100;
        const consents = {
            privacy: true,
            agb: true,
            revocation: true
        };

        console.log("Attempting submission to Real DB...");
        const result = await submitEnrollment(
            formData as any,
            selectedCourseIds,
            startMonth,
            totalPrice,
            consents
        );

        console.log("Real DB Submission Result:", JSON.stringify(result, null, 2));

        if (!result.success) {
            throw new Error(`Registration Failed: ${result.message} - ${JSON.stringify(result.error)}`);
        }

        expect(result.success).toBe(true);
    });
});
