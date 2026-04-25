// ═══════════════════════════════════════════════════════════════════
// BAC TRACKER — SEED DATA
// This file provides the INITIAL data only.
// After first load, everything is stored in IndexedDB and fully editable via the UI.
// To reset to this seed, use the "Réinitialiser" button.
// ═══════════════════════════════════════════════════════════════════

const SEED_DATA = {
  subjects: [
    {
      id: 'physique-chimie',
      name: 'Physique-Chimie',
      icon: '⚛️',
      level: '2BAC SVT',
      order: 0,
      domains: [
        {
          id: 'physique',
          name: 'Physique',
          weight: 67,
          order: 0,
          modules: [
            {
              id: 'ondes',
              name: 'Ondes',
              icon: '🌊',
              weight: 14,
              priority: false,
              order: 0,
              lessons: [
                {
                  id: 'les-1',
                  name: 'Ondes mécaniques progressives',
                  order: 0,
                  subchapters: [
                    { id: 'sc-1-0', text: "Définition d'une onde mécanique et de sa célérité" },
                    { id: 'sc-1-1', text: "Ondes longitudinales et ondes transversales" },
                    { id: 'sc-1-2', text: "Onde progressive à une dimension" },
                    { id: 'sc-1-3', text: "Notion de retard temporel entre deux points" },
                    { id: 'sc-1-4', text: "Relation y_M(t) = y_S(t − τ)" },
                    { id: 'sc-1-5', text: "Exploitation de τ = d/v" }
                  ],
                  formulas: ["τ = d/v", "y_M(t) = y_S(t − τ)", "v = d/Δt"],
                  tips: [
                    "τ = d/v — la formule centrale",
                    "M reproduit S avec un retard (courbe décalée vers la droite)",
                    "Transversale = ⊥ propagation / Longitudinale = // propagation",
                    "Célérité ≠ vitesse de vibration",
                    "La célérité dépend du MILIEU, pas de la forme de l'onde"
                  ],
                  traps: [
                    "Confondre célérité et vitesse d'un point",
                    "Oublier que l'onde ne transporte pas de matière",
                    "Décaler dans le mauvais sens",
                    "Unités incohérentes"
                  ]
                },
                {
                  id: 'les-2',
                  name: 'Ondes mécaniques progressives périodiques',
                  order: 1,
                  subchapters: [
                    { id: 'sc-2-0', text: "Périodicité temporelle et spatiale" },
                    { id: 'sc-2-1', text: "Onde sinusoïdale : T, f, λ" },
                    { id: 'sc-2-2', text: "Relation λ = v × T" },
                    { id: 'sc-2-3', text: "Phénomène de diffraction — condition a ≤ λ" },
                    { id: 'sc-2-4', text: "Caractéristiques de l'onde diffractée" },
                    { id: 'sc-2-5', text: "Milieu dispersif" }
                  ],
                  formulas: ["T = 1/f", "λ = v × T = v/f", "Diffraction : a ≤ λ"],
                  tips: [
                    "λ = vT = v/f — formule reine",
                    "T sur y=f(t) / λ sur y=f(x) — NE PAS CONFONDRE",
                    "L'onde diffractée garde λ, f et v — seule sa direction change",
                    "Milieu dispersif : v dépend de f"
                  ],
                  traps: [
                    "Confondre T (temps) et λ (espace)",
                    "Écrire λ = v/T au lieu de λ = v × T",
                    "Croire que la diffraction change f"
                  ]
                },
                {
                  id: 'les-3',
                  name: 'Propagation des ondes lumineuses',
                  order: 2,
                  subchapters: [
                    { id: 'sc-3-0', text: "Aspect ondulatoire de la lumière" },
                    { id: 'sc-3-1', text: "Propagation dans le vide" },
                    { id: 'sc-3-2', text: "Diffraction lumineuse — θ = λ/a" },
                    { id: 'sc-3-3', text: "Lumière monochromatique vs polychromatique" },
                    { id: 'sc-3-4', text: "Spectre visible : 400–800 nm" },
                    { id: 'sc-3-5', text: "Indice de réfraction n = c/v" },
                    { id: 'sc-3-6', text: "Dispersion par un prisme" },
                    { id: 'sc-3-7', text: "Conservation de f lors du changement de milieu" },
                    { id: 'sc-3-8', text: "Milieux plus ou moins dispersifs" }
                  ],
                  formulas: ["n = c/v (n ≥ 1)", "θ = λ/a (rad)", "c ≈ 3×10⁸ m/s", "λ_milieu = λ_vide/n"],
                  tips: [
                    "Diffraction = preuve du caractère ondulatoire",
                    "θ = λ/a en radians !",
                    "Rouge diffracte plus que violet",
                    "n = c/v toujours ≥ 1",
                    "Changement de milieu : f reste, λ et v changent",
                    "Prisme décompose car verre = dispersif"
                  ],
                  traps: [
                    "Confondre θ (rad) et largeur de tache (m)",
                    "Écrire n = v/c (INVERSION FATALE)",
                    "Croire que f change lors du changement de milieu",
                    "Utiliser λ_vide dans un milieu"
                  ]
                }
              ]
            },
            {
              id: 'nucleaire',
              name: 'Transformations nucléaires',
              icon: '☢️',
              weight: 8,
              priority: false,
              order: 1,
              lessons: [
                {
                  id: 'les-4',
                  name: 'Décroissance radioactive',
                  order: 0,
                  subchapters: [
                    { id: 'sc-4-0', text: "Stabilité/instabilité des noyaux — composition" },
                    { id: 'sc-4-1', text: "Isotopes" },
                    { id: 'sc-4-2', text: "Diagramme (N,Z) — domaines de stabilité" },
                    { id: 'sc-4-3', text: "Radioactivité α, β⁺, β⁻ et émission γ" },
                    { id: 'sc-4-4', text: "Lois de conservation (charge et nucléons)" },
                    { id: 'sc-4-5', text: "Loi de décroissance N(t) = N₀e^(-λt)" },
                    { id: 'sc-4-6', text: "Activité A (unité : Bq)" },
                    { id: 'sc-4-7', text: "Constante de temps τ et demi-vie t½" },
                    { id: 'sc-4-8', text: "Application à la datation" }
                  ],
                  formulas: ["N(t) = N₀·e^(-λt)", "A(t) = λ·N(t)", "t½ = ln(2)/λ", "τ = 1/λ"],
                  tips: [
                    "2 lois de conservation : A et Z",
                    "α : émet ⁴₂He (perd 4 nucléons, 2 protons)",
                    "β⁻ : neutron → proton + e⁻ (Z+1)",
                    "β⁺ : proton → neutron + e⁺ (Z-1)",
                    "γ : désexcitation (A et Z inchangés)",
                    "t½ = 0,693/λ",
                    "Après n demi-vies : N₀/2ⁿ"
                  ],
                  traps: [
                    "Oublier une loi de conservation",
                    "Confondre τ et t½",
                    "Unités de λ incohérentes avec t"
                  ]
                },
                {
                  id: 'les-5',
                  name: 'Noyaux — Masse et énergie',
                  order: 1,
                  subchapters: [
                    { id: 'sc-5-0', text: "Défaut de masse Δm et énergie de liaison E_l" },
                    { id: 'sc-5-1', text: "Énergie de liaison par nucléon E_l/A" },
                    { id: 'sc-5-2', text: "Unités de masse et énergie (u, MeV, kg, J)" },
                    { id: 'sc-5-3', text: "Courbe d'Aston — noyaux les plus stables" },
                    { id: 'sc-5-4', text: "Équivalence masse-énergie E = mc²" },
                    { id: 'sc-5-5', text: "Bilan énergétique d'une réaction nucléaire" },
                    { id: 'sc-5-6', text: "Types de réactions : fission, fusion, radioactivité" },
                    { id: 'sc-5-7', text: "Applications et dangers de la radioactivité" }
                  ],
                  formulas: ["Δm = Z·m_p + (A-Z)·m_n - m_noyau", "E_l = Δm·c²", "E = mc²", "1u×c² ≈ 931,5 MeV"],
                  tips: [
                    "Δm > 0 TOUJOURS",
                    "Plus E_l/A grand → plus stable (max Fe, A≈56)",
                    "Fission et fusion libèrent énergie",
                    "Réaction exo-énergétique : ΔE < 0"
                  ],
                  traps: [
                    "Oublier que Δm est POSITIF",
                    "Se tromper de signe dans le bilan",
                    "Confondre E_l totale et par nucléon"
                  ]
                }
              ]
            },
            {
              id: 'electricite',
              name: 'Électricité',
              icon: '⚡',
              weight: 19,
              priority: false,
              order: 2,
              lessons: [
                {
                  id: 'les-6',
                  name: 'Dipôle RC',
                  order: 0,
                  subchapters: [
                    { id: 'sc-6-0', text: "Le condensateur : description, symbole, charges" },
                    { id: 'sc-6-1', text: "Convention récepteur — i, u, q" },
                    { id: 'sc-6-2', text: "Relation i = dq/dt" },
                    { id: 'sc-6-3', text: "Relation q = C·u" },
                    { id: 'sc-6-4', text: "Capacité C (F, µF, nF, pF)" },
                    { id: 'sc-6-5', text: "Association série et parallèle" },
                    { id: 'sc-6-6', text: "Réponse à un échelon (charge et décharge)" },
                    { id: 'sc-6-7', text: "Équation différentielle et solution" },
                    { id: 'sc-6-8', text: "Constante de temps τ = RC" },
                    { id: 'sc-6-9', text: "Énergie emmagasinée E_c = ½Cu²" }
                  ],
                  formulas: ["i = dq/dt", "q = C·u", "τ = RC", "E_c = ½Cu²", "Charge : u_c = E(1-e^(-t/τ))", "Décharge : u_c = E·e^(-t/τ)"],
                  tips: [
                    "q = C·u — de là découle TOUT",
                    "Après 5τ : régime permanent (99%)",
                    "τ graphique : à t=τ, u_c = 0,63E (charge)",
                    "u_c(t) est CONTINUE (pas de saut)",
                    "À t=0 : u_c=0, i=E/R",
                    "En régime permanent : i=0, u_c=E"
                  ],
                  traps: [
                    "Confondre charge et décharge",
                    "Unités µF, nF, pF",
                    "Oublier que u_c est continue",
                    "Inverser formules d'association"
                  ]
                },
                {
                  id: 'les-7',
                  name: 'Dipôle RL',
                  order: 1,
                  subchapters: [
                    { id: 'sc-7-0', text: "La bobine : description, symbole" },
                    { id: 'sc-7-1', text: "Tension u = r·i + L·di/dt" },
                    { id: 'sc-7-2', text: "Inductance L (unité : H)" },
                    { id: 'sc-7-3', text: "Résistance interne r" },
                    { id: 'sc-7-4', text: "Réponse à un échelon (établissement et rupture)" },
                    { id: 'sc-7-5', text: "Équation différentielle et solution" },
                    { id: 'sc-7-6', text: "Constante de temps τ = L/R" },
                    { id: 'sc-7-7', text: "Énergie emmagasinée E_m = ½Li²" }
                  ],
                  formulas: ["u = r·i + L·di/dt", "τ = L/(R+r)", "E_m = ½Li²", "i(t) = (E/R)(1-e^(-t/τ))"],
                  tips: [
                    "La bobine s'oppose aux variations de i",
                    "i(t) CONTINUE, u_L peut être discontinue",
                    "À t=0 : i=0, u_L=E",
                    "En régime permanent : di/dt=0, i=E/(R+r)",
                    "Analogie RC/RL : u_c↔i, ½Cu²↔½Li²"
                  ],
                  traps: [
                    "Oublier le terme r·i",
                    "Confondre établissement et rupture",
                    "τ = L/(R+r), pas R·L"
                  ]
                },
                {
                  id: 'les-8',
                  name: 'Circuit RLC — Oscillations libres',
                  order: 2,
                  subchapters: [
                    { id: 'sc-8-0', text: "Oscillations libres : décharge condensateur/bobine" },
                    { id: 'sc-8-1', text: "3 régimes : périodique, pseudo-périodique, apériodique" },
                    { id: 'sc-8-2', text: "Influence de l'amortissement — pseudo-période" },
                    { id: 'sc-8-3', text: "Période propre T₀ = 2π√(LC)" },
                    { id: 'sc-8-4', text: "Équation différentielle" },
                    { id: 'sc-8-5', text: "Interprétation énergétique (condensateur ↔ bobine)" },
                    { id: 'sc-8-6', text: "Diagrammes d'énergie" },
                    { id: 'sc-8-7', text: "Entretien des oscillations" }
                  ],
                  formulas: ["T₀ = 2π√(LC)", "ω₀ = 1/√(LC)", "d²q/dt² + (1/LC)·q = 0", "E_T = ½q²/C + ½Li²"],
                  tips: [
                    "R faible → pseudo-périodique",
                    "R grand → apériodique",
                    "T₀ = 2π√(LC) PAR CŒUR",
                    "Sans amortissement : E_T = constante"
                  ],
                  traps: [
                    "Confondre T₀ et pseudo-période T",
                    "T₀ = 2π√(LC), pas 2π/√(LC)"
                  ]
                }
              ]
            },
            {
              id: 'mecanique',
              name: 'Mécanique',
              icon: '🏃',
              weight: 26,
              priority: true,
              order: 3,
              lessons: [
                {
                  id: 'les-9',
                  name: 'Lois de Newton',
                  order: 0,
                  subchapters: [
                    { id: 'sc-9-0', text: "Vecteur vitesse et vecteur accélération" },
                    { id: 'sc-9-1', text: "Coordonnées cartésiennes et base de Frenet" },
                    { id: 'sc-9-2', text: "Produit scalaire a·v (accéléré/retardé)" },
                    { id: 'sc-9-3', text: "Référentiel galiléen" },
                    { id: 'sc-9-4', text: "2ème loi de Newton : ΣF = m·a" },
                    { id: 'sc-9-5', text: "Rôle de la masse dans l'inertie" },
                    { id: 'sc-9-6', text: "3ème loi de Newton : actions réciproques" }
                  ],
                  formulas: ["v = dOM/dt", "a = dv/dt", "ΣF_ext = m·a_G", "F_A/B = -F_B/A"],
                  tips: [
                    "a·v > 0 → accéléré / a·v < 0 → retardé",
                    "Base Frenet : a_T = dv/dt, a_N = v²/ρ",
                    "Méthode : système → référentiel → bilan → 2ème loi → projection"
                  ],
                  traps: [
                    "Oublier une force",
                    "Mauvais référentiel",
                    "ΣF est une somme VECTORIELLE"
                  ]
                },
                {
                  id: 'les-10',
                  name: 'Applications des lois de Newton',
                  order: 1,
                  subchapters: [
                    { id: 'sc-10-0', text: "Chute libre verticale — équation différentielle" },
                    { id: 'sc-10-1', text: "MRUV — équations horaires" },
                    { id: 'sc-10-2', text: "Exploitation du diagramme v_G = f(t)" },
                    { id: 'sc-10-3', text: "Mouvement sur plan horizontal" },
                    { id: 'sc-10-4', text: "Mouvement sur plan incliné" },
                    { id: 'sc-10-5', text: "Projectile — équations différentielles" },
                    { id: 'sc-10-6', text: "Équations horaires du projectile" },
                    { id: 'sc-10-7', text: "Équation de la trajectoire (parabole)" },
                    { id: 'sc-10-8', text: "Portée et flèche" },
                    { id: 'sc-10-9', text: "Choix du référentiel" }
                  ],
                  formulas: ["Chute : v=gt, y=½gt²", "MRUV : v=at+v₀", "Portée = v₀²sin(2α)/g", "Flèche = (v₀sinα)²/(2g)"],
                  tips: [
                    "Projectile : x → MRU, y → MRUV",
                    "Portée max à α = 45°",
                    "Au sommet : v_y = 0 mais v_x ≠ 0",
                    "Plan incliné sans frottement : a = g·sin(θ)"
                  ],
                  traps: [
                    "Oublier v₀",
                    "v_x est CONSTANTE",
                    "Mal projeter forces sur plan incliné"
                  ]
                },
                {
                  id: 'les-11',
                  name: 'Systèmes oscillants',
                  order: 2,
                  subchapters: [
                    { id: 'sc-11-0', text: "Mouvement oscillatoire et oscillations libres" },
                    { id: 'sc-11-1', text: "Systèmes : pendule, solide-ressort" },
                    { id: 'sc-11-2', text: "Position d'équilibre, amplitude, période propre" },
                    { id: 'sc-11-3', text: "Amortissement et ses régimes" },
                    { id: 'sc-11-4', text: "Pseudo-période ≈ T₀ si amortissement faible" },
                    { id: 'sc-11-5', text: "Force de rappel d'un ressort" },
                    { id: 'sc-11-6', text: "Équation différentielle du solide-ressort" },
                    { id: 'sc-11-7', text: "Équations horaires x(t), v(t), a(t)" },
                    { id: 'sc-11-8', text: "Période propre T₀ = 2π√(m/k)" },
                    { id: 'sc-11-9', text: "Amortissement solide et fluide" },
                    { id: 'sc-11-10', text: "Phénomène de résonance" }
                  ],
                  formulas: ["F = -k·x", "T₀ = 2π√(m/k)", "ω₀ = √(k/m)", "x(t) = X_m·cos(ω₀t + φ)"],
                  tips: [
                    "T₀ = 2π√(m/k) PAR CŒUR",
                    "À t=0, x=X_m → φ=0",
                    "Résonance : f_excit = f_propre → amplitude max"
                  ],
                  traps: [
                    "Oublier signe - dans F = -kx",
                    "Confondre ω₀ et f₀",
                    "Mal déterminer φ"
                  ]
                },
                {
                  id: 'les-12',
                  name: 'Aspects énergétiques',
                  order: 3,
                  subchapters: [
                    { id: 'sc-12-0', text: "Travail d'une force du ressort" },
                    { id: 'sc-12-1', text: "Énergie potentielle élastique E_pe = ½kx²" },
                    { id: 'sc-12-2', text: "Relation W et variation de E_pe" },
                    { id: 'sc-12-3', text: "Énergie mécanique du solide-ressort" },
                    { id: 'sc-12-4', text: "Conservation de E_m (sans frottement)" },
                    { id: 'sc-12-5', text: "Non-conservation de E_m (avec frottement)" },
                    { id: 'sc-12-6', text: "Diagrammes d'énergie" }
                  ],
                  formulas: ["E_pe = ½kx²", "E_c = ½mv²", "E_m = E_c + E_pe", "W_ressort = -ΔE_pe"],
                  tips: [
                    "Quand x=0 : E_pe=0, tout en E_c → v MAX",
                    "Quand x=±X_m : E_c=0, tout en E_pe → v=0",
                    "Avec frottement : E_m diminue"
                  ],
                  traps: [
                    "Oublier le ½ dans E_pe = ½kx²",
                    "Croire que E_m toujours conservée"
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'chimie',
          name: 'Chimie',
          weight: 33,
          order: 1,
          modules: [
            {
              id: 'transf-rl',
              name: 'Transformations rapides et lentes',
              icon: '🔭',
              weight: 7,
              priority: false,
              order: 0,
              lessons: [
                {
                  id: 'les-13',
                  name: 'Transformations lentes et rapides',
                  order: 0,
                  subchapters: [
                    { id: 'sc-13-0', text: "Rappels sur les couples Ox/Red" },
                    { id: 'sc-13-1', text: "Écriture des équations d'oxydo-réduction" },
                    { id: 'sc-13-2', text: "Transformations lentes et rapides" },
                    { id: 'sc-13-3', text: "Facteur cinétique : température" },
                    { id: 'sc-13-4', text: "Facteur cinétique : concentration des réactifs" }
                  ],
                  formulas: ["Demi-équation : Ox + n·e⁻ ⇌ Red"],
                  tips: [
                    "OIL RIG : Oxidation Is Loss, Reduction Is Gain",
                    "Équilibrer : atomes → O avec H₂O → H avec H⁺ → charges avec e⁻",
                    "↑T → ↑vitesse / ↑[réactifs] → ↑vitesse"
                  ],
                  traps: [
                    "Ne pas équilibrer e⁻ avant somme",
                    "Confondre oxydant et réducteur"
                  ]
                },
                {
                  id: 'les-14',
                  name: 'Suivi temporel — Vitesse de réaction',
                  order: 1,
                  subchapters: [
                    { id: 'sc-14-0', text: "Suivi temporel d'une transformation" },
                    { id: 'sc-14-1', text: "Tableau d'avancement" },
                    { id: 'sc-14-2', text: "Courbes d'évolution (n, [X], x, conductivité)" },
                    { id: 'sc-14-3', text: "Équivalence lors d'un titrage" },
                    { id: 'sc-14-4', text: "Vitesse volumique v = (1/V)·(dx/dt)" },
                    { id: 'sc-14-5', text: "Influence de la concentration et température" },
                    { id: 'sc-14-6', text: "Interprétation qualitative de la vitesse" },
                    { id: 'sc-14-7', text: "Détermination graphique de la vitesse" },
                    { id: 'sc-14-8', text: "Temps de demi-réaction t½" }
                  ],
                  formulas: ["v = (1/V)·(dx/dt)", "n(X) = n₀(X) ± ν·x", "x(t½) = x_max/2"],
                  tips: [
                    "TOUJOURS dresser le tableau d'avancement",
                    "v = pente de la tangente à x(t)",
                    "Vitesse max au début, nulle à la fin"
                  ],
                  traps: [
                    "Oublier ν dans tableau",
                    "Calculer v sans diviser par V"
                  ]
                }
              ]
            },
            {
              id: 'non-totales',
              name: 'Transformations non totales',
              icon: '⚖️',
              weight: 11,
              priority: true,
              order: 1,
              lessons: [
                {
                  id: 'les-15',
                  name: 'Transformations dans les deux sens',
                  order: 0,
                  subchapters: [
                    { id: 'sc-15-0', text: "Notion de pH — mesure" },
                    { id: 'sc-15-1', text: "Mise en évidence : x_f < x_max" },
                    { id: 'sc-15-2', text: "Modélisation avec double flèche ⇌" },
                    { id: 'sc-15-3', text: "Caractérisation d'une transformation limitée" },
                    { id: 'sc-15-4', text: "Taux d'avancement final τ = x_f/x_max" }
                  ],
                  formulas: ["pH = -log([H₃O⁺])", "τ = x_f/x_max (0 ≤ τ ≤ 1)"],
                  tips: [
                    "Brønsted : acide donne H⁺, base accepte H⁺",
                    "x_f = 10^(-pH)·V",
                    "Double flèche ⇌ → τ < 1"
                  ],
                  traps: [
                    "Oublier V dans x_f",
                    "Utiliser → pour réaction limitée"
                  ]
                },
                {
                  id: 'les-16',
                  name: "État d'équilibre d'un système chimique",
                  order: 1,
                  subchapters: [
                    { id: 'sc-16-0', text: "Quotient de réaction Q_r (expression littérale)" },
                    { id: 'sc-16-1', text: "Solution homogène ou hétérogène" },
                    { id: 'sc-16-2', text: "Q_r,éq à l'équilibre = K" },
                    { id: 'sc-16-3', text: "Constante d'équilibre K (ne dépend que de T)" },
                    { id: 'sc-16-4', text: "Influence de l'état initial sur τ_f" }
                  ],
                  formulas: ["Q_r = [produits]^n / [réactifs]^m", "À l'équilibre : Q_r,éq = K"],
                  tips: [
                    "Solides et H₂O solvant exclus de Q_r",
                    "K grand → réaction quasi-totale",
                    "Équilibre dynamique : v_directe = v_inverse"
                  ],
                  traps: [
                    "Inclure H₂O ou solides dans Q_r",
                    "Confondre Q_r et K"
                  ]
                },
                {
                  id: 'les-17',
                  name: 'Réactions acido-basiques en solution aqueuse',
                  order: 2,
                  subchapters: [
                    { id: 'sc-17-0', text: "Autoprotolyse de l'eau" },
                    { id: 'sc-17-1', text: "Produit ionique K_e et pK_e = 14" },
                    { id: 'sc-17-2', text: "Échelle de pH (acide, basique, neutre)" },
                    { id: 'sc-17-3', text: "Constante d'acidité K_A et pK_A" },
                    { id: 'sc-17-4', text: "Comparaison acides/bases de même concentration" },
                    { id: 'sc-17-5', text: "Diagrammes de prédominance et distribution" },
                    { id: 'sc-17-6', text: "Zone de virage d'un indicateur coloré" },
                    { id: 'sc-17-7', text: "Titrage pH-métrique" },
                    { id: 'sc-17-8', text: "Choix de l'indicateur coloré adéquat" }
                  ],
                  formulas: ["K_e = [H₃O⁺][HO⁻] = 10⁻¹⁴", "pK_A = -log(K_A)", "pH = pK_A + log([A⁻]/[AH])"],
                  tips: [
                    "pK_A petit → acide fort",
                    "Au point de demi-équivalence : pH = pK_A",
                    "Dosage : simple flèche → (totale)"
                  ],
                  traps: [
                    "pH + pOH = 14 seulement à 25°C",
                    "Utiliser ⇌ dans un dosage"
                  ]
                }
              ]
            },
            {
              id: 'sens-evolution',
              name: "Sens d'évolution",
              icon: '⚡',
              weight: 7,
              priority: false,
              order: 2,
              lessons: [
                {
                  id: 'les-18',
                  name: 'Évolution spontanée',
                  order: 0,
                  subchapters: [
                    { id: 'sc-18-0', text: "Critère d'évolution : Q_r tend vers K" },
                    { id: 'sc-18-1', text: "Application aux réactions acido-basiques" },
                    { id: 'sc-18-2', text: "Application aux réactions d'oxydo-réduction" }
                  ],
                  formulas: ["Q_r < K → sens direct (→)", "Q_r > K → sens inverse (←)", "Q_r = K → équilibre"],
                  tips: [
                    "Comparer Q_r à K systématiquement",
                    "Système évolue toujours vers l'équilibre"
                  ],
                  traps: [
                    "Inverser le raisonnement"
                  ]
                },
                {
                  id: 'les-19',
                  name: "Piles et récupération d'énergie",
                  order: 1,
                  subchapters: [
                    { id: 'sc-19-0', text: "Transfert spontané d'électrons (couples Mⁿ⁺/M)" },
                    { id: 'sc-19-1', text: "Constitution et fonctionnement d'une pile" },
                    { id: 'sc-19-2', text: "Schéma conventionnel" },
                    { id: 'sc-19-3', text: "Force électromotrice (f.é.m)" },
                    { id: 'sc-19-4', text: "Sens du courant et des porteurs de charges" },
                    { id: 'sc-19-5', text: "Rôle du pont salin" },
                    { id: 'sc-19-6', text: "Réactions aux électrodes et équation bilan" },
                    { id: 'sc-19-7', text: "Pile = système hors équilibre" },
                    { id: 'sc-19-8', text: "Pile usée : Q_r = K" },
                    { id: 'sc-19-9', text: "Quantité d'électricité Q = I·Δt = n(e⁻)·F" }
                  ],
                  formulas: ["Q = I·Δt = n(e⁻)·F", "F = 96500 C/mol"],
                  tips: [
                    "AN-OX / CA-RED",
                    "Électrons : de - vers + (extérieur)",
                    "Courant : de + vers - (extérieur)"
                  ],
                  traps: [
                    "Inverser anode/cathode",
                    "Oublier F = 96500"
                  ]
                }
              ]
            },
            {
              id: 'controle',
              name: "Contrôle de l'évolution",
              icon: '🔧',
              weight: 8,
              priority: false,
              order: 3,
              lessons: [
                {
                  id: 'les-20',
                  name: 'Estérification et hydrolyse',
                  order: 0,
                  subchapters: [
                    { id: 'sc-20-0', text: "Groupes caractéristiques : -OH, -CO₂H, -CO₂R, anhydride" },
                    { id: 'sc-20-1', text: "Équations d'estérification et d'hydrolyse" },
                    { id: 'sc-20-2', text: "Retrouver acide et alcool à partir de l'ester" },
                    { id: 'sc-20-3', text: "Nommer les esters (max 5 carbones)" },
                    { id: 'sc-20-4', text: "Caractéristiques : lentes et limitées" },
                    { id: 'sc-20-5', text: "Constante d'équilibre K" },
                    { id: 'sc-20-6', text: "Rôle du catalyseur" },
                    { id: 'sc-20-7', text: "Déplacement d'équilibre (excès, élimination)" },
                    { id: 'sc-20-8', text: "Composition du mélange à un instant donné" }
                  ],
                  formulas: ["RCOOH + R'OH ⇌ RCOOR' + H₂O", "η = n_ester formé / n_ester théorique"],
                  tips: [
                    "LENTES, LIMITÉES, ATHERMIQUES",
                    "Primaire ≈ 67%, secondaire ≈ 60%, tertiaire ≈ 5%",
                    "↑rendement : excès réactif ou élimination produit"
                  ],
                  traps: [
                    "Catalyseur ne change pas l'équilibre",
                    "T ne déplace pas équilibre"
                  ]
                },
                {
                  id: 'les-21',
                  name: 'Contrôle par changement de réactif ou catalyse',
                  order: 1,
                  subchapters: [
                    { id: 'sc-21-0', text: "Matériel expérimental (reflux, distillation, filtration)" },
                    { id: 'sc-21-1', text: "Règles de sécurité" },
                    { id: 'sc-21-2', text: "Protocole expérimental" },
                    { id: 'sc-21-3', text: "Réaction anhydride d'acide + alcool" },
                    { id: 'sc-21-4', text: "Saponification : RCOOR' + HO⁻ → RCOO⁻ + R'OH" },
                    { id: 'sc-21-5', text: "Caractéristiques anhydride + alcool (rapide et totale)" },
                    { id: 'sc-21-6', text: "Rendement d'une transformation" },
                    { id: 'sc-21-7', text: "Parties hydrophile et hydrophobe (savon)" },
                    { id: 'sc-21-8', text: "Rôles du catalyseur (accélérateur, sélectif)" }
                  ],
                  formulas: ["(RCO)₂O + R'OH → RCOOR' + RCOOH", "RCOOR' + HO⁻ → RCOO⁻ + R'OH"],
                  tips: [
                    "Anhydride + alcool : RAPIDE et TOTALE",
                    "Chauffage à reflux : accélère sans perdre volatils",
                    "Saponification : totale et rapide"
                  ],
                  traps: [
                    "Utiliser ⇌ pour anhydride+alcool"
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
