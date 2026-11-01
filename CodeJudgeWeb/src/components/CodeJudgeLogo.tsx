import React from "react";

interface CodeJudgeLogoProps {
  size?: number;
  className?: string;
}

export const CodeJudgeLogo: React.FC<CodeJudgeLogoProps> = ({ size = 28, className = "" }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={`brand-logo-svg ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 10L5 16L10 22"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 10L27 16L22 22"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8L14 24"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
