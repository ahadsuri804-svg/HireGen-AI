import React from "react";
import { Check, X } from "lucide-react";

const PasswordStrengthMeter = ({ password }) => {
    const requirements = [
        { label: "At least 8 characters", valid: password.length >= 8 },
        { label: "Contains uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "Contains lowercase letter", valid: /[a-z]/.test(password) },
        { label: "Contains a number", valid: /\d/.test(password) },
        { label: "Contains special character", valid: /[@$!%*?&]/.test(password) },
    ];

    const strength = requirements.filter((r) => r.valid).length;

    const getColor = () => {
        if (strength <= 2) return "bg-red-500";
        if (strength <= 4) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getLabel = () => {
        if (strength <= 2) return "Weak";
        if (strength <= 4) return "Medium";
        return "Strong";
    };

    return (
        <div className="mt-2 space-y-2">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">Strength</span>
                <span className={`font-semibold ${strength <= 2 ? "text-red-500" : strength <= 4 ? "text-yellow-500" : "text-green-500"
                    }`}>
                    {password.length > 0 ? getLabel() : ""}
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${getColor()}`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                ></div>
            </div>

            {/* Rquirements List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-3">
                {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        {req.valid ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <X className="h-3 w-3 text-slate-400" />
                        )}
                        <span className={req.valid ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
