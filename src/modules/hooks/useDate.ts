import {useEffect, useState} from "react";

/**
 * updateSecごとに更新される現在時刻をミリ秒単位で取得する
 * @param updateSec 更新する間隔(秒単位). デフォルトは1秒
 */
export const useDate = (updateSec: number = 1) => {
    const [time, setTime] = useState(new Date().getTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime((prev) => prev + 1000 * updateSec);
        }, 1000 * (updateSec ?? 1))

        return () => {
            clearInterval(timer);
        }
    }, [])

    return time;
}