// =============================================================================
// AFFICHAGE DE LA DATE DE CRÉATION UTILISATEUR (Client Component)
// -----------------------------------------------------------------------------
// On isole le formatage de la date ici car :
//   1. `toLocaleString()` dépend du fuseau horaire du serveur, ce qui peut
//      varier entre le build et l'exécution → Next.js considère cela comme
//      non déterministe et refuse de prérendre.
//   2. En rendant ce composant côté navigateur, la date est calculée avec le
//      fuseau horaire de l'utilisateur, ce qui est plus pertinent au passage.
//   3. Cela retire complètement la lecture de date du prérendu serveur,
//      éliminant l'erreur "Date.now() unstable".
// =============================================================================

"use client"

export function UserCreatedAt({ iso }: { iso: string }) {
  // On parse la chaîne ISO et on formate en français.
  // Le fuseau utilisé est celui du navigateur de l'utilisateur final.
  return <span>{new Date(iso).toLocaleString("fr-FR")}</span>
}