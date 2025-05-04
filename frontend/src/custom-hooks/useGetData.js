import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const BASE_URL =
    process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_API_URL
        : "http://localhost:5000/api";

const useGetData = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${BASE_URL}/${endpoint}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error(
                            "Session expired. Please log in again."
                        );
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
                }

                setData(await response.json());
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(error.message);
                setData([]);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint]);

    return { data, loading, error };
};

export default useGetData;
