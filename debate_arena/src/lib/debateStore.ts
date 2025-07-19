export type Debate = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  image?: string;
  duration: number;
  creator: string;
};

export const debates: Debate[] = []; 