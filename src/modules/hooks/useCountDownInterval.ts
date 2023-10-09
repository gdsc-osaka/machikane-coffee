// https://zenn.dev/kazuki_tam/scraps/1e2984ea02b838

import { useEffect } from 'react'

const useCountDownInterval = (
    countTime: number | null,
    setCountTime: (arg0: number) => void,
) => {
    useEffect(() => {
        const countDownInterval = setInterval(() => {
            if (countTime === 0) {
                clearInterval(countDownInterval)
            }
            if (countTime && countTime > 0) {
                setCountTime(countTime - 1)
            }
        }, 1000)
        return () => {
            clearInterval(countDownInterval)
        }
    }, [countTime])
}

export { useCountDownInterval }