/**
 * Un bloc gris à la place d'un contenu qui arrive. Il dit « ça vient » là
 * où une page blanche laisse croire que rien ne se passe.
 *
 * L'animation est lente et de faible amplitude : un squelette qui clignote
 * fort attire l'œil sur l'attente au lieu de la faire oublier.
 */
export function Squelette({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-icone bg-surface ${className}`}
    />
  );
}
