import { forwardRef, useEffect, useRef } from "react";

export default forwardRef(function TextArea({ className = "", isFocused = false, ...props }, ref) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <textarea
            {...props}
            className={
                "rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 " +
                className
            }
            ref={input}
        />
    );
});
