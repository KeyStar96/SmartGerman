'use server';

import { createClient } from '@/utils/supabase/server'; // Assumes you have a standard server client setup
import { CourseConfig, CourseSession, CourseType, InstructorKey } from '@/lib/course-config';

// If you don't have this util yet, here is a pragmatic version inline or replace with your actual import
// import { createClient } from '@supabase/supabase-js'; 
// But for Next.js App Router, usage of `createServerClient` from `@supabase/ssr` is recommended in a utils file.
// For this generation, I'll assume usage of the globally available `createClient` from a standard path.
// If valid utils path is missing, please adjust import.

export async function getCourses(): Promise<CourseConfig[]> {
    // 1. Initialize Supabase Client
    // Using a hypothetical utility for now. If this file doesn't exist, create it or use process.env directly cautiously.
    // Ideally: import { createClient } from '@/utils/supabase/server';
    // Fallback for demonstration if you use direct envs (not recommended for prod without proper util):
    const supabase = createClient();

    // 2. Fetch Data
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*');

    if (error) {
        console.error('Error fetching courses from Supabase:', error);
        // Return empty or throw based on preference. 
        // For resilience, returning empty array might be safer for UI, but logging is critical.
        return [];
    }

    if (!courses) return [];

    // 3. Map DB Snake_Case to CamelCase Types
    return courses.map((record: any) => ({
        id: record.id,
        translationKey: record.translation_key,
        type: record.type as CourseType,
        price: Number(record.price), // ensure number
        sessions: record.sessions as CourseSession[],
        instructor: record.instructor as InstructorKey,
        unitDuration: record.unit_duration,
        // Add defaults for optional fields if they don't exist in DB yet or are not needed
        highlight: false,
        level: undefined
    }));
}
