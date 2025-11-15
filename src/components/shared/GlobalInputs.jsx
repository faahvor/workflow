import React from "react";

const GlobalInput = ({
  label,
  type = "text",
  name,
  value,
  placeholder = "",
  onChange,
  onBlur,
  className = "",
  error = "",
  labelClassName = "",
  inputHeight = "", // <-- Accept inputHeight
  ...props
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className={`block md:text-[15px] text-[12px] pb-[8px] font-medium ${labelClassName}`}>{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        className={`border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : ""
        } ${inputHeight}`} // <-- Add inputHeight here
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default GlobalInput;