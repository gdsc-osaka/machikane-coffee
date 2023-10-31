import {useEffect, useState} from "react";

/**
 * Dateをリアルタイムで取得する
 * @param updateSec 更新する間隔(秒単位). デフォルトは1秒
 */
export const useDate = (updateSec: number = 1) => {
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