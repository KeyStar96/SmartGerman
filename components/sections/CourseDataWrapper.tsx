import { getCourses } from "@/app/actions/get-courses";
import dynamic from "next/dynamic";

const Courses = dynamic(() => import("@/components/sections/Courses"));
const TimetableSection = dynamic(() => import("@/components/sections/Timetable/TimetableSection"));

interface CourseDataWrapperProps {
    dictionary: any;
}

export default async function CourseDataWrapper({ dictionary }: CourseDataWrapperProps) {
    const courses = await getCourses();

    if (!courses || courses.length === 0) return null;

    return (
        <>
            <Courses dictionary={dictionary} courses={courses} />
            <TimetableSection dictionary={dictionary} courses={courses} />
        </>
    );
}
