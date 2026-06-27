export type SimulationResult = {
  total: number;
  results: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
  }>;
};
