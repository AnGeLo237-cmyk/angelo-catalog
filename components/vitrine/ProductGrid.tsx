// // src/components/vitrine/ProductGrid.tsx
// // Composant consommé en Phase 7. Ne rend pour l'instant que la structure
// // (les cartes produits seront ajoutées avec le reste de la vitrine).
// import type { Product, CatalogLayout } from "@/lib/types/shop"

// interface ProductGridProps {
//   products: Product[]
//   layout: CatalogLayout
// }

// export function ProductGrid({ products, layout }: ProductGridProps) {
//   if (layout === "list") {
//     return (
//       <div className="flex flex-col gap-4">
//         {products.map((p) => (
//           <div key={p.id} className="border rounded p-4">
//             {/* rendu carte horizontale — détaillé en Phase 7 */}
//             <span>{p.name}</span>
//           </div>
//         ))}
//       </div>
//     )
//   }

//   const cols =
//     layout === "grid-2"
//       ? "grid-cols-1 sm:grid-cols-2"
//       : layout === "grid-4"
//         ? "grid-cols-2 sm:grid-cols-4"
//         : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

//   return (
//     <div className={`grid ${cols} gap-4`}>
//       {products.map((p) => (
//         <div key={p.id} className="border rounded p-4">
//           {/* rendu carte — détaillé en Phase 7 */}
//           <span>{p.name}</span>
//         </div>
//       ))}
//     </div>
//   )
// }