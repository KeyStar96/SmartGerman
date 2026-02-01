
import { submitEnrollment } from '@/app/actions/submit-enrollment';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Mock Data
const formData = {
    personal: {
        firstName: "Debug",
        lastName: "User",
        email: "debug.user@example.com",
        phone: "+49123456789",
        street: "Debug Street 1",
        zip: "12345",
        city: "Debug City",
        birthDate: "01.01.1990"
    }
};

const selectedCourseIds = ["c_a1_1_50plus"]; // Ensure this ID exists in your DB or courses config
const startMonth = "0-2026"; // Jan 2026
const totalPrice = 100;
const consents = {
    privacy: true,
    agb: true,
    revocation: true
};

async function runDebug() {
    console.log("Starting Debug Enrollment...");
    try {
        const result = await submitEnrollment(
            formData as any,
            selectedCourseIds,
            startMonth,
            totalPrice,
            consents
        );
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("CRITICAL FAILURE:", e);
    }
}

runDebug();
