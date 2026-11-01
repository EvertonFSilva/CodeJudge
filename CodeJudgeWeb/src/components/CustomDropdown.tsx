import React, { useState, useRef, useEffect } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Selecione uma opção",
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Group options if any option has group defined
  const groupedOptions = options.reduce<Record<string, DropdownOption[]>>((acc, opt) => {
    const grp = opt.group || "__nogroup__";
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(opt);
    return acc;
  }, {});

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${isOpen ? "open" : ""} ${className}`}
    >
      <button
        type="button"
        className="dropdown-trigger-btn"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <div className="dropdown-trigger-left">
          {selectedOption?.icon || icon || (
            <svg
              className="dropdown-trigger-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
          <span className="dropdown-current-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <svg
          className="dropdown-chevron-svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-popover fade-in">
          {Object.entries(groupedOptions).map(([groupName, groupOpts]) => (
            <div key={groupName} className="dropdown-group">
              {groupName !== "__nogroup__" && (
                <div className="dropdown-section-title">{groupName}</div>
              )}
              {groupOpts.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    className={`dropdown-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt.value)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelect(opt.value);
                      }
                    }}
                  >
                    <div className="dropdown-option-header">
                      <div className="d-flex align-items-center gap-2">
                        {opt.icon}
                        <span className="dropdown-option-title">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <svg
                          className="option-check-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    {opt.description && (
                      <div className="dropdown-option-desc">{opt.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
