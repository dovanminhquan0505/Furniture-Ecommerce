import { useEffect, useState } from "react"
import useAuth from "./useAuth";


const useSeller = () => {
    const [ isSeller, setIsSeller ] = useState(false);
    const [isLoading, setIsLoading ] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        setIsLoading(true);

        if(currentUser) {
            try {
                
            } catch (error) {
                
            }
        }
    })

}

export default useSeller