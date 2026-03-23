import { useEffect } from 'react'

export function useDismissOnClick(dismiss: () => void, active: boolean) {
    useEffect(() => {
        if (!active) return
        const handler = () => dismiss()
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [active])
}
