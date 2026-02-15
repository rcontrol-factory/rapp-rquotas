// client/src/hooks/use-settings.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";

/**
 * Ajuste os endpoints aqui se o seu backend usar outro caminho.
 * Pelo seu projeto, o mais comum é /api/settings
 */
const SETTINGS_ENDPOINT = "/api/settings";

export type CompanySettings = any;

export function useSettings() {
  return useQuery<CompanySettings>({
    queryKey: [SETTINGS_ENDPOINT],
    queryFn: async () => {
      const res = await apiRequest("GET", SETTINGS_ENDPOINT);
      return res.json();
    },
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("PUT", SETTINGS_ENDPOINT, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_ENDPOINT] });
    },
  });
}
