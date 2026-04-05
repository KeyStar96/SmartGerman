'use server';

import { createClient } from '@/utils/supabase/server'; // Assumes you have a standard server client setup
import { CourseConfig, CourseSession, CourseType, InstructorKey } from '@/lib/course-config';

// If you don't have this util yet, here is a pragmatic version inline or replace with your actual import
// import { createClient } from '@supabase/supabase-js'; 
// But for Next.js App Router, usage of `createServerClient` from `@supabase/ssr` is recommended in a utils file.
// For this generation, I'll assume usage of the globally available `createClient` from a standard path.
// If valid utils path is missing, please adjust import.

export async function getCourses(): Promise<CourseConfig[]> {
    try {
        // 1. Initialize Supabase Client
        const supabase = await createClient();

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
        const mappedCourses = courses.map((record: any) => ({
            id: record.id,
            translationKey: record.translation_key,
            title: record.title,
            type: record.type as CourseType,
            price: Number(record.price), // ensure number
            sessions: record.sessions as CourseSession[],
            instructor: record.instructor as InstructorKey,
            unitDuration: record.unit_duration,
            // Add defaults for optional fields if they don't exist in DB yet or are not needed
            highlight: false,
            level: undefined
        }));

        // 4. Sort courses
        // Order: Intensivkurse (not speech) first, then Sprechtraining (speech).
        // Then by level: A1.1, A1.2, A2, B1, B2, C1...
        const getLevelRank = (id: string) => {
            if (id.includes('a1_1')) return 1;
            if (id.includes('a1_2')) return 2;
            if (id.includes('a2')) return 3;
            if (id.includes('b1')) return 4;
            if (id.includes('b2')) return 5;
            if (id.includes('c1')) return 6;
            return 99;
        };

        const getTypeRank = (id: string, type: string) => {
            if (type === 'online') return 1; // Online courses have their own isolated tab
            if (id.includes('speech')) return 2; // Sprechtraining comes second
            return 1; // Intensivkurse comes first
        };

        return mappedCourses.sort((a, b) => {
            const typeRankA = getTypeRank(a.id, a.type);
            const typeRankB = getTypeRank(b.id, b.type);
            if (typeRankA !== typeRankB) return typeRankA - typeRankB;
            
            const levelRankA = getLevelRank(a.id);
            const levelRankB = getLevelRank(b.id);
            return levelRankA - levelRankB;
        });
    } catch (err) {
        console.error("Unexpected error in getCourses:", err);
        return [];
    }
}
