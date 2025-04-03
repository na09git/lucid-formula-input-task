// src/hooks/useAutocomplete.ts
import { useQuery } from '@tanstack/react-query';

const mockSuggestions = [
  'x', 'y', 'z', 'revenue', 'cost', 'profit',
  'sales cycle', 'sales assumptions', 'sign change(array)', 'spread(array1, array2)', 'sqrt(number)', 'stdev(array)', // First set
  'churn rate', 'churn ARR', 'chisk(k)', 'chauchy(beta,scale)', 'outbound message sent', // Second set
  'month (dividen, devisor)', 'month', 'month_from_date(date)', 'contact length (month)', 'sales cycle month', 'demos', 'meeting ->demos', // Third set
];

const fetchSuggestions = async (query: string) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
  return mockSuggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
};

export const useAutocomplete = (query: string) => {
  return useQuery({
    queryKey: ['suggestions', query],
    queryFn: () => fetchSuggestions(query),
    enabled: !!query,
  });
};