/**
 * QUEST PROGRESS TRACKER — Global Action Interceptor
 * 
 * Listens to all tRPC mutation successes and auto-increments
 * quest progress on the backend. Works alongside useSoundOfMoney.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MUTATION_QUEST_MAP, getQuestCategoryForPath } from "./useSoundOfMoney";

export function useQuestTracker() {
  const queryClient = useQueryClient();
  const lastTrackedRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated" || event?.action?.type !== "success") return;
      
      // Throttle: don't track more than once per 500ms
      const now = Date.now();
      if (now - lastTrackedRef.current < 500) return;
      
      // Extract mutation key/path
      const mutationKey = event?.mutation?.options?.mutationKey;
      const path = Array.isArray(mutationKey) 
        ? mutationKey.flat().join(".") 
        : String(mutationKey || "");
      
      if (!path) return;
      
      // Don't track the quest progress mutation itself (avoid infinite loop)
      if (path.includes("questProgress")) return;
      
      // Look up quest category
      const category = MUTATION_QUEST_MAP[path] || getQuestCategoryForPath(path);
      
      if (category) {
        lastTrackedRef.current = now;
        // Fire-and-forget POST to increment quest progress
        fetch("/api/rpc/questProgress.incrementAction?batch=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ "0": { json: { category, mutationPath: path } } }),
        }).catch(() => { /* silently ignore quest tracking failures */ });
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [queryClient]);
}
