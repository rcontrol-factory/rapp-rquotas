import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertCompanySettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/use-locale";

export function useSettings() {
  return useQuery({
    queryKey: ["/api/settings"],
  });
}

export function useUpdateSettings() {
  const { toast } = useToast();
  const { locale } = useLocale();

  return useMutation({
    mutationFn: async (data: InsertCompanySettings) => {
      await apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: locale === "pt" ? "Configurações salvas" : "Settings saved",
      });
    },
    onError: () => {
      toast({
        title: locale === "pt" ? "Erro ao salvar" : "Failed to save",
      });
    },
  });
}
