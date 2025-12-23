
export interface Banknote {
  id: string;
  pickId: string;
  country: string;
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
  estimatedValue: string; // Novo: Valor de mercado/estimado
  comments: string;
  images: {
    front?: string;
    back?: string;
    detail1?: string;
    detail2?: string;
  };
  createdAt: number;
}

export type ImageSlot = 'front' | 'back' | 'detail1' | 'detail2';
