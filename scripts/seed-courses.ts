
import { createClient } from '@supabase/supabase-js';
import { COURSES } from '../lib/course-config';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// Fallback to .env
dotenv.config();

// Instructions:
// 1. Install dependencies: npm install @supabase/supabase-js dotenv
// 2. Set environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env or directly in script execution)
// 3. Run with: npx tsx scripts/seed-courses.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Debug Info ---');
console.log('CWD:', process.cwd());
console.log('.env.local path:', path.resolve(process.cwd(), '.env.local'));
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.slice(0, 10)}...` : 'undefined');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? `${supabaseKey.slice(0, 5)}...` : 'undefined');
console.log('------------------');

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_')) {
    console.error('Error: Please provide specific NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCourses() {
    console.log(`Starting seed for ${COURSES.length} courses...`);

    // Transform config to DB schema
    const rows = COURSES.map(course => ({
        id: course.id,
        translation_key: course.translationKey,
        type: course.type,
        price: course.price,
        sessions: course.sessions, // JSONB handles mapping automatically
        instructor: course.instructor,
        unit_duration: course.unitDuration
    }));

    const { data, error } = await supabase
        .from('courses')
        .upsert(rows, { onConflict: 'id' })
        .select();

    if (error) {
        console.error('Error seeding courses:', error);
    } else {
        console.log('Successfully seeded/updated courses:', data?.length);
    }
}

seedCourses();
