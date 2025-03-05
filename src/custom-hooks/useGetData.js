import { useEffect, useState } from "react";
import { auth } from "../firebase.config";
import { toast } from "react-toastify";

const useGetData = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshToken = async () => {
        try {
            const refreshTokenValue = localStorage.getItem("refreshToken");
            if (!refreshTokenValue)
                throw new Error("No refresh token available");

            const response = await fetch(
                "http://localhost:5000/api/auth/refresh-token",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken: refreshTokenValue }),
                }
            );

            if (!response.ok) throw new Error("Failed to refresh token");

            const { token: newCustomToken } = await response.json();
            const userCredential = await auth.signInWithCustomToken(
                newCustomToken
            );
            return await userCredential.user.getIdToken();
        } catch (error) {
            console.error("Token refresh failed:", error);
            toast.error("Session expired. Please log in again.");
            return null;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                let token = auth.currentUser
                    ? await auth.currentUser.getIdToken()
                    : null;

                if (!token) {
                    token =
                        localStorage.getItem("accessToken") ||
                        localStorage.getItem("authToken");
                    if (!token) {
                        console.error("No authentication token found");
                        setError("Please log in to access this data");
                        setLoading(false);
                        return;
                    }
                }

                const response = await fetch(
                    `http://localhost:5000/api/${endpoint}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        // Thử làm mới token nếu hết hạn
                        const newToken = await refreshToken();
                        if (!newToken)
                            throw new Error(
                                "Session expired. Please log in again."
                            );

                        const retryResponse = await fetch(
                            `http://localhost:5000/api/${endpoint}`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${newToken}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        if (!retryResponse.ok)
                            throw new Error("Retry failed after token refresh");
                        setData(await retryResponse.json());
                    } else if (response.status === 404) {
                        console.warn(
                            `Endpoint /${endpoint} not found, returning empty array`
                        );
                        setData([]);
                        setLoading(false);
                        return;
                    } else {
                        throw new Error(
                            `Server error! Status: ${response.status}`
                        );
                    }
                } else {
                    setData(await response.json());
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(error.message);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint]);

    return { data, loading, error };
};

export default useGetData;
