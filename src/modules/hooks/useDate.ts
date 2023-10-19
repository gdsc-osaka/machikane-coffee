import {useEffect, useState} from "react";

export const useDate = (updateSec?: number) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() =>
            setTime(new Date()), 1000 * (updateSec ?? 1))

        return () => {
            clearInterval(timer);
        }
    }, [])

    return time;
}