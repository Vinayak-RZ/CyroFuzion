// hooks/useUserOrders.ts
import { useEffect, useState } from "react";

export function useUserOrders(walletAddress: string) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!walletAddress) return;

        const fetchOrders = async () => {
            setLoading(true);
            const res = await fetch(`/api/orders/${walletAddress}`);
            const data = await res.json();
            setOrders(data);
            setLoading(false);
        };

        fetchOrders();
    }, [walletAddress]);

    return { orders, loading };
}
