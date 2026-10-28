import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, useClerk } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currency = import.meta.env.VITE_CURRENCY;

    const { getToken, isSignedIn, isLoaded } = useAuth();
    const { signOut } = useClerk();

    const [user, setUser] = useState(null);
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [pickupDate, setPickupDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [cars, setCars] = useState([]);
    const [theme, setTheme] = useState(() => {
        const stored = window.localStorage.getItem("rideshare-theme");
        return stored === "dark" || stored === "light" ? stored : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        window.localStorage.setItem("rideshare-theme", theme);
    }, [theme]);

    // A dedicated axios instance. The old code mutated the global
    // axios.defaults.headers, which leaked a stale token across every request.
    // Attaching the header in an interceptor means it is refreshed per request
    // and rotated automatically when Clerk refreshes the session.
    const api = useMemo(() => {
        const instance = axios.create({ baseURL: import.meta.env.VITE_BASE_URL });

        instance.interceptors.request.use(async (config) => {
            try {
                const token = await getToken();
                if (token) config.headers.Authorization = `Bearer ${token}`;
            } catch {
                // Signed out - let the request through unauthenticated and let
                // the backend answer 401.
            }
            return config;
        });

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                // Keep the server's actionable message. Otherwise every page
                // only receives Axios's generic "Request failed" wording.
                error.message = error.response?.data?.message || error.message;
                return Promise.reject(error);
            }
        );

        return instance;
    }, [getToken]);

    const fetchUser = useCallback(async () => {
        setIsUserLoading(true);
        try {
            const { data } = await api.get("/api/user/data");
            if (data.success) {
                setUser(data.user);
                if (!data.user.profileCompleted && location.pathname !== "/complete-profile" && !location.pathname.startsWith("/sign-in")) {
                    navigate("/complete-profile", { replace: true });
                }
            }
        } catch (error) {
            if ([401, 403].includes(error.response?.status)) setUser(null);
            else toast.error(error.message);
        } finally {
            setIsUserLoading(false);
        }
    }, [api, location.pathname, navigate]);

    const fetchCars = useCallback(async () => {
        try {
            const { data } = await api.get("/api/user/cars");
            data.success ? setCars(data.cars) : toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    }, [api]);

    const logout = async () => {
        await signOut();
        setUser(null);
        setIsUserLoading(false);
        toast.success("You have been logged out");
    };

    const toggleTheme = () => setTheme(current => current === "dark" ? "light" : "dark");

    useEffect(() => {
        fetchCars();
        const refreshTimer = window.setInterval(fetchCars, 8000);
        return () => window.clearInterval(refreshTimer);
    }, [fetchCars]);

    // Only trust the role once Clerk has resolved the session, otherwise a
    // refresh briefly treats a signed-in user as signed out.
    useEffect(() => {
        if (!isLoaded) return;
        if (isSignedIn) {
            fetchUser();
        } else {
            setUser(null);
            setIsUserLoading(false);
        }
    }, [isLoaded, isSignedIn, fetchUser]);

    const role = user?.role || null;
    const isAdmin = role === "admin";
    const isUser = role === "user";

    const value = {
        navigate,
        currency,
        axios: api,
        user,
        setUser,
        role,
        isAdmin,
        isUser,
        isSignedIn,
        isLoaded,
        isUserLoading,
        fetchUser,
        logout,
        fetchCars,
        cars,
        setCars,
        pickupDate,
        setPickupDate,
        returnDate,
        setReturnDate,
        theme,
        toggleTheme,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    return useContext(AppContext);
};
