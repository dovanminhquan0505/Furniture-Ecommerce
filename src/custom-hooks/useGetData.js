import { useEffect, useState } from "react";

// Retrieves data from a specified Firestore collection.
// This hook can be reused throughout a React application to fetch data from different Firestore collections dynamically.
const useGetData = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get auth token from localStorage
                const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken");
                
                if (!token) {
                    console.error("No authentication token found");
                    setError("Authentication required");
                    setLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("Authentication required");
                    } else if (response.status === 404) {
                        console.warn(`Endpoint /${endpoint} not found, returning empty array`);
                        setData([]);
                        setLoading(false);
                        return;
                    } else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }

                const result = await response.json();

                setData(result);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError(error.message);
                
                // Fallback to empty array to prevent UI crash
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