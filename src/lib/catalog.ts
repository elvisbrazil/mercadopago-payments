export type Product = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
};

export const products: Product[] = [
  {
    id: "cafe-especial",
    title: "Café especial 250g",
    description: "Grãos torrados da Mantiqueira de Minas.",
    priceCents: 4890,
  },
  {
    id: "caneca-esmaltada",
    title: "Caneca esmaltada",
    description: "Caneca de 350ml, azul petróleo.",
    priceCents: 6990,
  },
  {
    id: "kit-coado",
    title: "Kit coado",
    description: "Suporte de cerâmica, 100 filtros e 500g de café.",
    priceCents: 18950,
  },
];

export function findProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
