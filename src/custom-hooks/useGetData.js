import { useEffect, useState } from "react";

// Retrieves data from a specified Firestore collection.
// This hook can be reused throughout a React application to fetch data from different Firestore collections dynamically.
const useGetData = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/${endpoint}`);
                const result = await response.json();
                setData(result);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [endpoint]);

    return { data, loading };
};

export default useGetData;
