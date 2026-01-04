import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Transition } from "@headlessui/react";
import { useState, useMemo } from "react";

export default function SearchableSelect({ items, value, onChange, label, placeholder = "Select an option", error }) {
    const [query, setQuery] = useState("");

    const selectedItem = useMemo(() => {
        return items.find((item) => item.id === value) || null;
    }, [items, value]);

    const filteredItems =
        query === ""
            ? items
            : items.filter((item) => {
                return item.name.toLowerCase().includes(query.toLowerCase());
            });

    return (
        <div className="w-full">
            <Combobox value={selectedItem} onChange={(item) => onChange(item ? item.id : null)}>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-left shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 sm:text-sm">
                        <ComboboxInput
                            className="w-full border-none py-3 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0"
                            displayValue={(item) => item?.name}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </ComboboxButton>
                    </div>
                    <Transition
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                    >
                        <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                            {filteredItems.length === 0 && query !== "" ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                    Nothing found.
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <ComboboxOption
                                        key={item.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-indigo-600 text-white" : "text-gray-900 dark:text-gray-100"
                                            }`
                                        }
                                        value={item}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${selected ? "font-medium" : "font-normal"
                                                        }`}
                                                >
                                                    {item.name}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? "text-white" : "text-indigo-600"
                                                            }`}
                                                    >
                                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </ComboboxOption>
                                ))
                            )}
                        </ComboboxOptions>
                    </Transition>
                </div>
            </Combobox>
            {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
        </div>
    );
}
