'use server';

import { createClient } from '@/utils/supabase/server';
import { CourseException } from '@/lib/course-config'; // Keep type for now

export async function getExceptions(): Promise<CourseException[]> {
    try {
        const supabase = await createClient();

        const { data: exceptions, error } = await supabase
            .from('course_exceptions')
            .select('*');

        if (error) {
            console.error('Error fetching exceptions:', error);
            return [];
        }

        if (!exceptions) return [];

        return exceptions.map((record: any) => ({
            date: record.date, // "YYYY-MM-DD"
            reason: record.reason,
            courseIds: record.course_ids || undefined
        }));
    } catch (err) {
        console.error("Unexpected error in getExceptions:", err);
        return [];
    }
}
