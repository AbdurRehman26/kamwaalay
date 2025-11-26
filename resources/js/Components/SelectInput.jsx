import { forwardRef, useRef } from 'react';

export default forwardRef(function SelectInput({ className = '', options = [], children, ...props }, ref) {
    const input = ref ? ref : useRef();

    return (
        <select
            {...props}
            className={
                'rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ' +
                className
            }
            ref={input}
        >
            {options.length > 0 ? (
                <>
                    <option value="" disabled>Select an option</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </>
            ) : (
                children
            )}
        </select>
    );
});
