import React, { useState, useEffect } from "react";
import "../../styles/clock.css";

const Clock = () => {
    //Set state for days, hours, minutes, seconds
    const [days, setDays] = useState();
    const [hours, setHours] = useState();
    const [minutes, setMinutes] = useState();
    const [seconds, setSeconds] = useState();

    const countDown = () => {
        const destination = new Date("June 15, 2025").getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = destination - now;

            //Calculate days, hours, minutes, seconds
            const newDays = Math.floor(distance / (1000 * 60 * 60 * 24));
            const newHours = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const newMinutes = Math.floor(
                (distance % (1000 * 60 * 60)) / (1000 * 60)
            );
            const newSeconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (distance < 0) {
                clearInterval(interval);
                setDays(0);
                setHours(0);
                setMinutes(0);
                setSeconds(0);
            } else {
                setDays(newDays);
                setHours(newHours);
                setMinutes(newMinutes);
                setSeconds(newSeconds);
            }
        }, 1000);

        return interval; 
    };

    useEffect(() => {
        const intervalId = countDown(); 

        return () => clearInterval(intervalId); 
    }, []); 

    return (
        <div className="clock__wrapper d-flex align-items-center gap-3">
            <div className="clock__data d-flex align-items-center gap-3">
                <div className="text-center">
                    <h1 className="text-white fs-3 mb-2">{days} </h1>
                    <h5 className="text-white fs-6">Days</h5>
                </div>
                <span className="text-white fs-3">:</span>
            </div>

            <div className="clock__data d-flex align-items-center gap-3">
                <div className="text-center">
                    <h1 className="text-white fs-3 mb-2">{hours} </h1>
                    <h5 className="text-white fs-6">Hours</h5>
                </div>
                <span className="text-white fs-3">:</span>
            </div>

            <div className="clock__data d-flex align-items-center gap-3">
                <div className="text-center">
                    <h1 className="text-white fs-3 mb-2">{minutes} </h1>
                    <h5 className="text-white fs-6">Minutes</h5>
                </div>
                <span className="text-white fs-3">:</span>
            </div>

            <div className="clock__data d-flex align-items-center gap-3">
                <div className="text-center">
                    <h1 className="text-white fs-3 mb-2">{seconds} </h1>
                    <h5 className="text-white fs-6">Seconds</h5>
                </div>
            </div>
        </div>
    );
};

export default Clock;
