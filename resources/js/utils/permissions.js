/**
 * Role-based permission utilities
 * Centralized logic for determining user roles and permissions
 */

/**
 * Check if user is a regular user (customer)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isUser = (user) => {
    return user?.role === "user";
};

/**
 * Check if user is a helper (individual service provider)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isHelper = (user) => {
    return user?.role === "helper";
};

/**
 * Check if user is a business (company managing workers)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isBusiness = (user) => {
    return user?.role === "business";
};

/**
 * Check if user is an admin
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isAdmin = (user) => {
    return user?.role === "admin";
};

/**
 * Check if user is a helper or business (service providers)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isHelperOrBusinessOrGuest = (user) => {
    return !user || isHelper(user) || isBusiness(user);
};

/**
 * Check if user is a helper or business (service providers)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isHelperOrBusiness = (user) => {
    return isHelper(user) || isBusiness(user);
};

/**
 * Check if user is a regular user or guest (not logged in)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isUserOrGuest = (user) => {
    return !user || isUser(user);
};

/**
 * Check if user is a helper or guest (not logged in)
 * @param {Object|null} user - The authenticated user object
 * @returns {boolean}
 */
export const isHelperOrGuest = (user) => {
    return !user || isHelper(user);
};

/**
 * Get the appropriate dashboard route for a user
 * @param {Object|null} user - The authenticated user object
 * @returns {string}
 */
export const getDashboardRoute = (user) => {
    if (!user) return "home";

    if (isAdmin(user)) return "admin.dashboard";
    if (isBusiness(user)) return "business.dashboard";
    return "dashboard";
};
