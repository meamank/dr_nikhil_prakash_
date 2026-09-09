import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatClinicalText } from "@repo/shared"
import { apiGet, apiPost } from "@/lib/api"

function clinicalOptionsKey(endpoint: string) {
  return ["clinical-options", endpoint] as const
}

export function useClinicalOptions({
  endpoint,
  optionsKey = "options",
  optionKey = "option",
}: {
  endpoint: string
  optionsKey?: string
  optionKey?: string
}) {
  const queryClient = useQueryClient()
  const queryKey = clinicalOptionsKey(endpoint)
  const optionsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiGet<Record<string, string[]>>(endpoint)
      return (response[optionsKey] ?? []).map(formatClinicalText)
    },
    // These are reusable clinic vocabulary lists and change infrequently.
    staleTime: 5 * 60_000,
  })
  const createOptionMutation = useMutation({
    mutationFn: (label: string) =>
      apiPost<Record<string, string>>(endpoint, { label }),
    onSuccess: (response) => {
      const savedOption = formatClinicalText(response[optionKey])
      queryClient.setQueryData<string[]>(queryKey, (current = []) =>
        Array.from(new Set([...current, savedOption]))
      )
    },
  })

  return {
    options: optionsQuery.data ?? [],
    loadError: optionsQuery.error,
    isLoading: optionsQuery.isLoading,
    isSaving: createOptionMutation.isPending,
    createOption: async (label: string) => {
      const response = await createOptionMutation.mutateAsync(label)
      return formatClinicalText(response[optionKey])
    },
    retry: () => optionsQuery.refetch(),
  }
}
