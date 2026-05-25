import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { CourseConfig, CourseSession, CourseType, InstructorKey } from '@/lib/course-config';

// ─── Stateless Supabase client (no cookies → enables static rendering) ───
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─── Cached data-fetch (revalidates every hour) ───
export const getCourses = unstable_cache(
    async (): Promise<CourseConfig[]> => {
        try {
            const { data: courses, error } = await supabase
                .from('courses')
                .select('*');

            if (error) {
                console.error('Error fetching courses from Supabase:', error);
                return [];
            }

            if (!courses) return [];

            // Map DB snake_case → camelCase
            const mappedCourses = courses.map((record: any) => ({
                id: record.id,
                translationKey: record.translation_key,
                title: record.title,
                type: record.type as CourseType,
                price: Number(record.price),
                sessions: record.sessions as CourseSession[],
                instructor: record.instructor as InstructorKey,
                unitDuration: record.unit_duration,
                startDate: record.start_date,
                endDate: record.end_date,
                trialLessons: record.trial_lessons !== false, // default to true if null
                highlight: false,
                level: undefined
            }));

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Sort: Intensivkurse first, then Sprechtraining, then by level
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
                if (type === 'online') return 1;
                if (id.includes('speech')) return 2;
                return 1;
            };

            return mappedCourses.sort((a, b) => {
                const typeRankA = getTypeRank(a.id, a.type);
                const typeRankB = getTypeRank(b.id, b.type);
                if (typeRankA !== typeRankB) return typeRankA - typeRankB;

                const levelRankA = getLevelRank(a.id);
                const levelRankB = getLevelRank(b.id);
                return levelRankA - levelRankB;
            }).filter((c) => {
                if (c.endDate) {
                    const end = new Date(c.endDate);
                    if (end < today) return false;
                }
                return true;
            });
        } catch (err) {
            console.error("Unexpected error in getCourses:", err);
            return [];
        }
    },
    ['courses_v2'],        // cache key
    { revalidate: 3600 }   // 1 hour
);
