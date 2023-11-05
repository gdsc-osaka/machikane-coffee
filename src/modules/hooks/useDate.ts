import {useEffect, useState} from "react";

/**
 * updateSecごとに更新される現在時刻をミリ秒単位で取得する
 * @param updateSec 更新する間隔(秒単位). デフォルトは1秒
 * @param pause 更新を止めるかどうか
 */
export const useDate = (updateSec: number = 1, pause: boolean = false) => {
    const [time, setTime] = useState(new Date().getTime());

    useEffect(() => {
        if (!pause) {
            const timer = setInterval(() => {
                setTime((prev) => prev + 1000 * updateSec);
            }, 1000 * updateSec);

            return () => {
                clearInterval(timer);
            }
        }
    }, [pause, updateSec])

    return time;
}