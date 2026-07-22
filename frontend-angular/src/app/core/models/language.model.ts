export interface Language {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
