import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/client/utilities/orpc'

export function useHello() {
    return useQuery({
        queryKey: ['hello'],
        queryFn: () => orpc['hello-private'](),
        retry: false,
    })
}