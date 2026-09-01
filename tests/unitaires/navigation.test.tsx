import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { REGLAGES_PAR_DEFAUT } from "@/lib/reglages/types";
import { NavigationLaterale } from "@/lib/design/NavigationLaterale";
import { BasculeNavigation } from "@/lib/design/BasculeNavigation";

const seDeconnecter = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/auth/actions", () => ({ seDeconnecter: (...a: unknown[]) => seDeconnecter(...a) }));

afterEach(() => {
  cleanup();
  seDeconnecter.mockClear();
  document.cookie = "nav_repliee=; path=/; max-age=0";
});

describe("NavigationLaterale", () => {
  it("affiche les libellés quand elle est dépliée", () => {
    const liens = [
      { libelle: "Clients", href: "/pilotage", icone: "clients" as const },
      { libelle: "Réglages", href: "/pilotage/reglages", icone: "crm" as const },
    ];
    render(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />);

    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Réglages")).toBeInTheDocument();
    expect(screen.getByText("Alice Dupont")).toBeInTheDocument();
    expect(screen.getByText("Pilotage")).toBeInTheDocument();
  });

  it("cache les libellés quand elle est repliée, mais laisse les titres", () => {
    const liens = [
      { libelle: "Clients", href: "/pilotage", icone: "clients" as const },
      { libelle: "Réglages", href: "/pilotage/reglages", icone: "crm" as const },
    ];
    const { container } = render(
      <NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={true} />,
    );

    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
    expect(screen.queryByText("Réglages")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice Dupont")).not.toBeInTheDocument();
    expect(screen.queryByText("Pilotage")).not.toBeInTheDocument();

    // Mais les liens restent présents avec un titre au survol
    const clients = container.querySelector("a[href='/pilotage']");
    expect(clients).toHaveAttribute("title", "Clients");
    const reglages = container.querySelector("a[href='/pilotage/reglages']");
    expect(reglages).toHaveAttribute("title", "Réglages");
  });

  it("tient toute la hauteur de l'écran, pas celle de la page", () => {
    // Le retour qui a produit cette règle : « mon nom écrit en bas s'enlève quand je vais
    // sur la partie statistique, il descend tout en bas ». Une barre à la
    // hauteur de son contenu suit la page ; ces trois classes sont ce qui la
    // colle à l'écran, et un test les nomme pour qu'on ne les retire pas par
    // mégarde en retouchant la mise en page.
    const liens = [{ libelle: "CRM", href: "/pilotage", icone: "crm" as const }];
    const { container } = render(
      <NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />,
    );

    const barre = container.querySelector("nav")!;
    expect(barre.className).toContain("sticky");
    expect(barre.className).toContain("top-0");
    expect(barre.className).toContain("h-screen");

    // Le pied reste ancré en bas même si la liste des liens perd son flex-1.
    const pied = container.querySelector("button[title='Se déconnecter']")!.closest("div")!;
    expect(pied.className).toContain("mt-auto");
  });

  it("signe du logotype du programme, pas de celui de l'éditeur", () => {
    // Le client vient chez son coach ; l'éditeur de l'outil signe ailleurs,
    // sur l'écran de connexion. Repliée, la barre n'affiche rien : il reste
    // 48 pixels une fois les marges retirées, dont 32 pour la bascule.
    const liens = [{ libelle: "Clients", href: "/pilotage", icone: "clients" as const }];
    render(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />);

    expect(screen.getByLabelText(REGLAGES_PAR_DEFAUT.nom_programme)).toBeInTheDocument();
    expect(screen.queryByText("Cocre8")).not.toBeInTheDocument();

    // Un remontage, pas un rerender : `repliee` n'est que la valeur initiale
    // d'un état local, changer la propriété ne le déplace plus une fois le
    // composant monté. C'est voulu, et c'est ce qui rend la bascule
    // instantanée.
    cleanup();
    render(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={true} />);
    expect(screen.queryByLabelText(REGLAGES_PAR_DEFAUT.nom_programme)).not.toBeInTheDocument();
  });

  it("se replie d'elle-même en largeur téléphone, quel que soit le réglage", () => {
    // Dépliée sur un écran de 375 pixels, la barre en prendrait 256 et il en
    // resterait 119 pour la page : ce n'est plus une navigation, c'est un
    // mur. Le repli forcé se fait en CSS et non en JavaScript, pour que le
    // rendu serveur et le rendu client disent la même chose.
    const liens = [{ libelle: "CRM", href: "/pilotage", icone: "crm" as const }];
    const { container } = render(
      <NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />,
    );

    expect(container.querySelector("nav")!.className).toContain("max-md:w-16");
    expect(screen.getByText("CRM").className).toContain("max-md:hidden");
    expect(screen.getByText("Alice Dupont").className).toContain("max-md:hidden");
  });

  it("rend deux liens qui visent la même adresse, tant que leurs libellés diffèrent", () => {
    // Les trois liens Circle pointent tous sur l'adresse provisoire de
    // l'académie. Une clé sur l'adresse ne fait pas disparaître les liens,
    // React les rend quand même, mais elle émet « Encountered two children
    // with the same key » sur console.error, et c'est ce qu'on observait sur
    // toutes les pages /espace. La clé porte donc sur le libellé, jamais
    // dupliqué dans une même barre : l'espion ci-dessous éprouve l'absence
    // d'avertissement, pas seulement la présence des liens.
    const espion = vi.spyOn(console, "error").mockImplementation(() => {});
    const liens = [
      { libelle: "Communauté", href: "https://exemple.circle.so/c/provisoire", icone: "crm" as const },
      { libelle: "Formation", href: "https://exemple.circle.so/c/provisoire", icone: "clients" as const },
    ];
    render(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />);

    expect(screen.getByText("Communauté")).toBeInTheDocument();
    expect(screen.getByText("Formation")).toBeInTheDocument();
    expect(espion).not.toHaveBeenCalled();
    espion.mockRestore();
  });

  it("rend les liens 'bientôt' non cliquables dans les deux états", () => {
    const liens = [
      { libelle: "CRM", href: "/pilotage", icone: "crm" as const },
      { libelle: "Profil", href: "/espace/profil", icone: "profil" as const, bientot: true },
    ];

    // Dépliée
    const { rerender } = render(
      <NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />,
    );
    expect(screen.getByRole("link", { name: "CRM" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Profil/ })).not.toBeInTheDocument();
    expect(screen.getByText("bientôt")).toBeInTheDocument();

    // Repliée
    rerender(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={true} />);
    expect(screen.queryByRole("link", { name: /Profil/ })).not.toBeInTheDocument();
    // En repliée, les icônes seules restent, avec le titre au survol
    const items = screen.getAllByRole("listitem");
    const profil = items.find((item) => item.querySelector("[title*='Profil']"));
    expect(profil).toBeDefined();
  });
});

describe("les groupes de NavigationLaterale", () => {
  const liens = [{ libelle: "CRM", href: "/pilotage", icone: "crm" as const }];
  const circle = [
    {
      titre: "Liens externes",
      liens: [
        {
          libelle: "Communauté",
          href: "https://exemple.circle.so/c/communaute",
          icone: "communaute" as const,
          externe: true,
        },
        {
          libelle: "Formation",
          href: "https://exemple.circle.so/c/formation",
          icone: "formation" as const,
          externe: true,
        },
      ],
    },
  ];

  it("affiche le titre du groupe et ses liens, dépliée", () => {
    render(
      <NavigationLaterale
        liens={liens}
        groupes={circle}
        nom="Alice Dupont"
        zone="Ton espace"
        repliee={false}
      />,
    );

    expect(screen.getByText("Liens externes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Communauté/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Formation/ })).toBeInTheDocument();
  });

  it("ouvre un lien externe dans un onglet à lui, sans prise sur la page d'origine", () => {
    // `rel` n'est pas décoratif : sans lui, la page ouverte garde un
    // window.opener sur l'espace du membre.
    const { container } = render(
      <NavigationLaterale
        liens={liens}
        groupes={circle}
        nom="Alice Dupont"
        zone="Ton espace"
        repliee={false}
      />,
    );

    const communaute = container.querySelector("a[href='https://exemple.circle.so/c/communaute']")!;
    expect(communaute).toHaveAttribute("target", "_blank");
    expect(communaute).toHaveAttribute("rel", "noopener noreferrer");
    expect(communaute).toHaveAttribute("title", "Communauté (nouvel onglet)");
  });

  it("garde le filet quand elle est repliée, là où le titre ne tient pas", () => {
    // Repliée, il ne reste que des icônes : sans le filet elles formeraient
    // une seule colonne continue et le regroupement disparaîtrait juste là
    // où il aide le plus.
    const { container } = render(
      <NavigationLaterale
        liens={liens}
        groupes={circle}
        nom="Alice Dupont"
        zone="Ton espace"
        repliee={true}
      />,
    );

    expect(screen.queryByText("Liens externes")).not.toBeInTheDocument();
    const communaute = container.querySelector("a[href='https://exemple.circle.so/c/communaute']")!;
    expect(communaute).toHaveAttribute("title", "Communauté (nouvel onglet)");
    expect(communaute.closest("div")!.className).toContain("border-t");
  });

  it("ne dessine rien pour un groupe sans lien", () => {
    // Tant qu'aucune adresse Circle n'est remplie, le titre et le filet
    // seraient un trait perdu au milieu de la barre.
    render(
      <NavigationLaterale
        liens={liens}
        groupes={[{ titre: "Liens externes", liens: [] }]}
        nom="Alice Dupont"
        zone="Ton espace"
        repliee={false}
      />,
    );

    expect(screen.queryByText("Liens externes")).not.toBeInTheDocument();
  });
});

describe("BasculeNavigation", () => {
  it("prévient son parent au clic, sans rien décider elle-même", () => {
    const onBasculer = vi.fn();
    render(<BasculeNavigation repliee={false} onBasculer={onBasculer} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onBasculer).toHaveBeenCalledTimes(1);
  });

  it("annonce l'état inverse dans son libellé accessible", () => {
    const { rerender } = render(<BasculeNavigation repliee={false} onBasculer={() => {}} />);
    expect(screen.getByRole("button", { name: "Replier la navigation" })).toBeInTheDocument();

    rerender(<BasculeNavigation repliee={true} onBasculer={() => {}} />);
    expect(screen.getByRole("button", { name: "Déplier la navigation" })).toBeInTheDocument();
  });
});

describe("le repli de NavigationLaterale", () => {
  const liens = [{ libelle: "CRM", href: "/pilotage", icone: "crm" as const }];

  it("bascule tout de suite au clic, sans attendre un nouveau rendu du serveur", () => {
    render(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />);
    expect(screen.getByText("CRM")).toBeInTheDocument();

    // Un seul clic, une seule assertion synchrone : si la bascule dépendait
    // encore d'un aller retour serveur, cette assertion arriverait trop tôt.
    fireEvent.click(screen.getByRole("button", { name: "Replier la navigation" }));

    expect(screen.queryByText("CRM")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Déplier la navigation" })).toBeInTheDocument();
  });

  it("mémorise le repli dans le cookie, pour la prochaine visite", () => {
    render(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Replier la navigation" }));

    expect(document.cookie).toContain("nav_repliee=1");
  });

  it("survit à un changement de page : l'état local ignore une nouvelle valeur du cookie une fois monté", () => {
    // Le cookie ne pilote le rendu qu'au premier rendu. Un layout persistant
    // qui repasse repliee={false} après coup (par exemple parce que le
    // composant n'a pas démonté) ne doit pas rouvrir une barre que le membre
    // vient de refermer.
    const { rerender } = render(
      <NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Replier la navigation" }));
    expect(screen.queryByText("CRM")).not.toBeInTheDocument();

    rerender(<NavigationLaterale liens={liens} nom="Alice Dupont" zone="Pilotage" repliee={false} />);
    expect(screen.queryByText("CRM")).not.toBeInTheDocument();
  });
});
