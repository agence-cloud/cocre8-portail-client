export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accompagnement: {
        Row: {
          cree_le: string
          date_debut: string
          date_fin: string | null
          id: string
          offre_id: string
          personne_id: string
          prix_negocie: number
          progression: number
          statut: Database["public"]["Enums"]["statut_accompagnement"]
        }
        Insert: {
          cree_le?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          offre_id: string
          personne_id: string
          prix_negocie: number
          progression?: number
          statut?: Database["public"]["Enums"]["statut_accompagnement"]
        }
        Update: {
          cree_le?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          offre_id?: string
          personne_id?: string
          prix_negocie?: number
          progression?: number
          statut?: Database["public"]["Enums"]["statut_accompagnement"]
        }
        Relationships: [
          {
            foreignKeyName: "accompagnement_offre_id_fkey"
            columns: ["offre_id"]
            isOneToOne: false
            referencedRelation: "offre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accompagnement_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      appel: {
        Row: {
          cree_le: string
          cree_par: string | null
          id: string
          issue: Database["public"]["Enums"]["issue_appel"]
          lien_enregistrement: string | null
          nature: Database["public"]["Enums"]["nature_appel"]
          notes: string | null
          personne_id: string | null
          prevu_le: string
          reference_externe: string | null
          source_externe: string | null
        }
        Insert: {
          cree_le?: string
          cree_par?: string | null
          id?: string
          issue?: Database["public"]["Enums"]["issue_appel"]
          lien_enregistrement?: string | null
          nature?: Database["public"]["Enums"]["nature_appel"]
          notes?: string | null
          personne_id?: string | null
          prevu_le: string
          reference_externe?: string | null
          source_externe?: string | null
        }
        Update: {
          cree_le?: string
          cree_par?: string | null
          id?: string
          issue?: Database["public"]["Enums"]["issue_appel"]
          lien_enregistrement?: string | null
          nature?: Database["public"]["Enums"]["nature_appel"]
          notes?: string | null
          personne_id?: string | null
          prevu_le?: string
          reference_externe?: string | null
          source_externe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appel_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "compte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appel_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      compte: {
        Row: {
          actif: boolean
          cree_le: string
          id: string
          nom: string
          personne_id: string | null
          role: Database["public"]["Enums"]["role_compte"]
        }
        Insert: {
          actif?: boolean
          cree_le?: string
          id: string
          nom: string
          personne_id?: string | null
          role: Database["public"]["Enums"]["role_compte"]
        }
        Update: {
          actif?: boolean
          cree_le?: string
          id?: string
          nom?: string
          personne_id?: string | null
          role?: Database["public"]["Enums"]["role_compte"]
        }
        Relationships: [
          {
            foreignKeyName: "compte_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      document: {
        Row: {
          chemin_storage: string
          cree_le: string
          depose_par: string | null
          id: string
          nom: string
          personne_id: string
          taille_octets: number | null
          type_mime: string | null
          visible_membre: boolean
        }
        Insert: {
          chemin_storage: string
          cree_le?: string
          depose_par?: string | null
          id?: string
          nom: string
          personne_id: string
          taille_octets?: number | null
          type_mime?: string | null
          visible_membre?: boolean
        }
        Update: {
          chemin_storage?: string
          cree_le?: string
          depose_par?: string | null
          id?: string
          nom?: string
          personne_id?: string
          taille_octets?: number | null
          type_mime?: string | null
          visible_membre?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "document_depose_par_fkey"
            columns: ["depose_par"]
            isOneToOne: false
            referencedRelation: "compte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      etape_historique: {
        Row: {
          etape: Database["public"]["Enums"]["etape_pipe"]
          id: string
          par_compte: string | null
          personne_id: string
          survenu_le: string
        }
        Insert: {
          etape: Database["public"]["Enums"]["etape_pipe"]
          id?: string
          par_compte?: string | null
          personne_id: string
          survenu_le?: string
        }
        Update: {
          etape?: Database["public"]["Enums"]["etape_pipe"]
          id?: string
          par_compte?: string | null
          personne_id?: string
          survenu_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "etape_historique_par_compte_fkey"
            columns: ["par_compte"]
            isOneToOne: false
            referencedRelation: "compte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etape_historique_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_entrant: {
        Row: {
          charge_utile: Json
          erreur: string | null
          id: string
          personne_id: string | null
          recu_le: string
          source_webhook: string | null
          traite: boolean
        }
        Insert: {
          charge_utile: Json
          erreur?: string | null
          id?: string
          personne_id?: string | null
          recu_le?: string
          source_webhook?: string | null
          traite?: boolean
        }
        Update: {
          charge_utile?: Json
          erreur?: string | null
          id?: string
          personne_id?: string | null
          recu_le?: string
          source_webhook?: string | null
          traite?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lead_entrant_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      offre: {
        Row: {
          active: boolean
          cree_le: string
          duree_mois: number | null
          id: string
          nom: string
          prix_defaut: number
          provisionne_espace: boolean
          type: Database["public"]["Enums"]["type_offre"]
        }
        Insert: {
          active?: boolean
          cree_le?: string
          duree_mois?: number | null
          id?: string
          nom: string
          prix_defaut: number
          provisionne_espace?: boolean
          type: Database["public"]["Enums"]["type_offre"]
        }
        Update: {
          active?: boolean
          cree_le?: string
          duree_mois?: number | null
          id?: string
          nom?: string
          prix_defaut?: number
          provisionne_espace?: boolean
          type?: Database["public"]["Enums"]["type_offre"]
        }
        Relationships: []
      }
      paiement: {
        Row: {
          accompagnement_id: string | null
          cree_le: string
          date_prevue: string | null
          date_reelle: string | null
          devise: string
          echeance: number | null
          id: string
          montant: number
          personne_id: string | null
          plan: number | null
          statut: Database["public"]["Enums"]["statut_paiement"]
          stripe_id: string | null
        }
        Insert: {
          accompagnement_id?: string | null
          cree_le?: string
          date_prevue?: string | null
          date_reelle?: string | null
          devise?: string
          echeance?: number | null
          id?: string
          montant: number
          personne_id?: string | null
          plan?: number | null
          statut?: Database["public"]["Enums"]["statut_paiement"]
          stripe_id?: string | null
        }
        Update: {
          accompagnement_id?: string | null
          cree_le?: string
          date_prevue?: string | null
          date_reelle?: string | null
          devise?: string
          echeance?: number | null
          id?: string
          montant?: number
          personne_id?: string | null
          plan?: number | null
          statut?: Database["public"]["Enums"]["statut_paiement"]
          stripe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiement_accompagnement_id_fkey"
            columns: ["accompagnement_id"]
            isOneToOne: false
            referencedRelation: "accompagnement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiement_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      parcours_modele: {
        Row: {
          actif: boolean
          cree_le: string
          id: string
          nom: string
          offre_id: string | null
        }
        Insert: {
          actif?: boolean
          cree_le?: string
          id?: string
          nom: string
          offre_id?: string | null
        }
        Update: {
          actif?: boolean
          cree_le?: string
          id?: string
          nom?: string
          offre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcours_modele_offre_id_fkey"
            columns: ["offre_id"]
            isOneToOne: false
            referencedRelation: "offre"
            referencedColumns: ["id"]
          },
        ]
      }
      personne: {
        Row: {
          a_relier: boolean
          campagne: string | null
          canal: Database["public"]["Enums"]["canal_lead"] | null
          chemin: Database["public"]["Enums"]["chemin_entree"] | null
          cree_le: string
          email: string | null
          entreprise: string | null
          etape: Database["public"]["Enums"]["etape_pipe"]
          id: string
          modifie_le: string
          motif_sortie: Database["public"]["Enums"]["motif_sortie"] | null
          nom: string
          notes: string | null
          offre_visee_id: string | null
          prenom: string | null
          prix_vise: number | null
          renvoye_academie: boolean
          renvoye_academie_le: string | null
          telephone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          a_relier?: boolean
          campagne?: string | null
          canal?: Database["public"]["Enums"]["canal_lead"] | null
          chemin?: Database["public"]["Enums"]["chemin_entree"] | null
          cree_le?: string
          email?: string | null
          entreprise?: string | null
          etape?: Database["public"]["Enums"]["etape_pipe"]
          id?: string
          modifie_le?: string
          motif_sortie?: Database["public"]["Enums"]["motif_sortie"] | null
          nom: string
          notes?: string | null
          offre_visee_id?: string | null
          prenom?: string | null
          prix_vise?: number | null
          renvoye_academie?: boolean
          renvoye_academie_le?: string | null
          telephone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          a_relier?: boolean
          campagne?: string | null
          canal?: Database["public"]["Enums"]["canal_lead"] | null
          chemin?: Database["public"]["Enums"]["chemin_entree"] | null
          cree_le?: string
          email?: string | null
          entreprise?: string | null
          etape?: Database["public"]["Enums"]["etape_pipe"]
          id?: string
          modifie_le?: string
          motif_sortie?: Database["public"]["Enums"]["motif_sortie"] | null
          nom?: string
          notes?: string | null
          offre_visee_id?: string | null
          prenom?: string | null
          prix_vise?: number | null
          renvoye_academie?: boolean
          renvoye_academie_le?: string | null
          telephone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personne_offre_visee_id_fkey"
            columns: ["offre_visee_id"]
            isOneToOne: false
            referencedRelation: "offre"
            referencedColumns: ["id"]
          },
        ]
      }
      pilier: {
        Row: {
          description: string | null
          id: string
          nom: string
          numero: number
          ordre: number
        }
        Insert: {
          description?: string | null
          id?: string
          nom: string
          numero: number
          ordre: number
        }
        Update: {
          description?: string | null
          id?: string
          nom?: string
          numero?: number
          ordre?: number
        }
        Relationships: []
      }
      question_profil: {
        Row: {
          active: boolean
          aide: string | null
          id: string
          libelle: string
          options: Json | null
          ordre: number
          pilier_id: string | null
          type: string
        }
        Insert: {
          active?: boolean
          aide?: string | null
          id?: string
          libelle: string
          options?: Json | null
          ordre: number
          pilier_id?: string | null
          type: string
        }
        Update: {
          active?: boolean
          aide?: string | null
          id?: string
          libelle?: string
          options?: Json | null
          ordre?: number
          pilier_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_profil_pilier_id_fkey"
            columns: ["pilier_id"]
            isOneToOne: false
            referencedRelation: "pilier"
            referencedColumns: ["id"]
          },
        ]
      }
      rendez_vous: {
        Row: {
          cree_le: string
          cree_par: string | null
          debut: string
          duree_minutes: number | null
          id: string
          lien_visio: string | null
          personne_id: string | null
          titre: string
          type: Database["public"]["Enums"]["type_rendez_vous"]
        }
        Insert: {
          cree_le?: string
          cree_par?: string | null
          debut: string
          duree_minutes?: number | null
          id?: string
          lien_visio?: string | null
          personne_id?: string | null
          titre: string
          type: Database["public"]["Enums"]["type_rendez_vous"]
        }
        Update: {
          cree_le?: string
          cree_par?: string | null
          debut?: string
          duree_minutes?: number | null
          id?: string
          lien_visio?: string | null
          personne_id?: string | null
          titre?: string
          type?: Database["public"]["Enums"]["type_rendez_vous"]
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "compte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
        ]
      }
      reponse_profil: {
        Row: {
          id: string
          modifie_le: string
          personne_id: string
          question_id: string
          reponse: string | null
        }
        Insert: {
          id?: string
          modifie_le?: string
          personne_id: string
          question_id: string
          reponse?: string | null
        }
        Update: {
          id?: string
          modifie_le?: string
          personne_id?: string
          question_id?: string
          reponse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reponse_profil_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reponse_profil_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_profil"
            referencedColumns: ["id"]
          },
        ]
      }
      tache: {
        Row: {
          cree_le: string
          cree_par: string | null
          description: string | null
          faite: boolean
          faite_le: string | null
          id: string
          ordre: number
          personne_id: string
          pilier_id: string
          titre: string
        }
        Insert: {
          cree_le?: string
          cree_par?: string | null
          description?: string | null
          faite?: boolean
          faite_le?: string | null
          id?: string
          ordre?: number
          personne_id: string
          pilier_id: string
          titre: string
        }
        Update: {
          cree_le?: string
          cree_par?: string | null
          description?: string | null
          faite?: boolean
          faite_le?: string | null
          id?: string
          ordre?: number
          personne_id?: string
          pilier_id?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "tache_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "compte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_personne_id_fkey"
            columns: ["personne_id"]
            isOneToOne: false
            referencedRelation: "personne"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_pilier_id_fkey"
            columns: ["pilier_id"]
            isOneToOne: false
            referencedRelation: "pilier"
            referencedColumns: ["id"]
          },
        ]
      }
      tache_modele: {
        Row: {
          description: string | null
          id: string
          ordre: number
          parcours_modele_id: string
          pilier_id: string
          titre: string
        }
        Insert: {
          description?: string | null
          id?: string
          ordre: number
          parcours_modele_id: string
          pilier_id: string
          titre: string
        }
        Update: {
          description?: string | null
          id?: string
          ordre?: number
          parcours_modele_id?: string
          pilier_id?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "tache_modele_parcours_modele_id_fkey"
            columns: ["parcours_modele_id"]
            isOneToOne: false
            referencedRelation: "parcours_modele"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_modele_pilier_id_fkey"
            columns: ["pilier_id"]
            isOneToOne: false
            referencedRelation: "pilier"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      a_un_compte: { Args: never; Returns: boolean }
      est_admin: { Args: never; Returns: boolean }
      ma_personne: { Args: never; Returns: string }
    }
    Enums: {
      canal_lead:
        | "meta_ads"
        | "youtube"
        | "linkedin"
        | "instagram"
        | "academie"
        | "bouche_a_oreille"
        | "prospection"
      chemin_entree: "vsl" | "reservation_directe" | "academie"
      etape_pipe: "lead" | "qualifie" | "appel_booke" | "client" | "perdu"
      issue_appel: "a_venir" | "honore" | "no_show"
      motif_sortie:
        | "trop_tot"
        | "hors_cible"
        | "pas_interesse"
        | "budget"
        | "injoignable"
      nature_appel: "prospection" | "coaching"
      role_compte: "admin" | "membre"
      statut_accompagnement: "actif" | "termine" | "suspendu"
      statut_paiement: "paye" | "en_attente" | "echoue"
      type_offre: "ponctuel" | "mensuel"
      type_rendez_vous: "collectif" | "individuel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      canal_lead: [
        "meta_ads",
        "youtube",
        "linkedin",
        "instagram",
        "academie",
        "bouche_a_oreille",
        "prospection",
      ],
      chemin_entree: ["vsl", "reservation_directe", "academie"],
      etape_pipe: ["lead", "qualifie", "appel_booke", "client", "perdu"],
      issue_appel: ["a_venir", "honore", "no_show"],
      motif_sortie: [
        "trop_tot",
        "hors_cible",
        "pas_interesse",
        "budget",
        "injoignable",
      ],
      nature_appel: ["prospection", "coaching"],
      role_compte: ["admin", "membre"],
      statut_accompagnement: ["actif", "termine", "suspendu"],
      statut_paiement: ["paye", "en_attente", "echoue"],
      type_offre: ["ponctuel", "mensuel"],
      type_rendez_vous: ["collectif", "individuel"],
    },
  },
} as const
