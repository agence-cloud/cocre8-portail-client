# Les modules

Chaque module porte ce qu'il est seul à manipuler. **Un module ne connaît
jamais l'autre.**

- ✅ `modules/portail/` lit la fiche client dans `lib/`. Un autre module
  écrirait dans la même fiche. Ils seraient reliés, par le socle.
- ❌ `modules/portail/` importe du code d'un autre module. Interdit.

Cet outil n'a qu'un module. La règle reste écrite parce qu'elle est la raison
pour laquelle il a pu être sorti d'une application plus grande sans tirer tout
le reste derrière lui : aucun import croisé n'avait été laissé passer.
