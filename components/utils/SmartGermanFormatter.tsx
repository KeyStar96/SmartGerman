import React from "react";

interface SmartGermanFormatterProps {
    text: string;
    className?: string;
}

export const SmartGermanFormatter: React.FC<SmartGermanFormatterProps> = ({
    text,
    className = "",
}) => {
    if (!text) return null;

    const parts = text.split("<<SmartGerman>>");

    return (
        <span className={className}>
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    {part}
                    {index < parts.length - 1 && (
                        <span className="font-bold inline-block">
                            <span className="text-[#2D3436] dark:text-[#E2D7CE]">Smart</span>
                            <span className="text-[#FF5C00]">German</span>
                        </span>
                    )}
                </React.Fragment>
            ))}
        </span>
    );
};
