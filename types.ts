
export interface Banknote {
  id: string;
  pickId: string;
  country: string;
  continent?: string; // Novo campo para filtragem
  authority: string;
  currency: string;
  denomination: string;
  issueDate: string;
  itemsInSet: string;
  setItemNumber: string;
  setDetails: string;
  type: string;
  material: string;
  size: string;
  grade: string;
  estimatedValue: string;
  comments: string;
  minister?: string;
  president?: string;
  stamp?: string;
  seriesNormal?: string;
  seriesReplacement?: string;
  images: {
    front?: string;
    back?: string;
    detail1?: string;
    detail2?: string;
  };
  createdAt: number;
}

export type ImageSlot = 'front' | 'back' | 'detail1' | 'detail2';
