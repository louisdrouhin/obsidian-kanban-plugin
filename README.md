# Plugin Daily Kanban

Un plugin Obsidian puissant pour gérer vos tâches dans un tableau Kanban. Organisez vos tâches quotidiennes sur plusieurs colonnes (Backlog, À faire, En cours, Terminé) avec la fonctionnalité de glisser-déposer et le support des tags de priorité.

## Fonctionnalités

- **Vue Tableau Kanban** : Visualisez vos tâches dans un tableau multi-colonnes
- **Glisser-déposer** : Déplacez les tâches entre les colonnes
- **Tags de Priorité** : Ajoutez des badges de priorité colorés (#MIT, #I, #NI) à vos tâches
- **Cycle de Statut Rapide** : Cliquez sur une carte pour parcourir les statuts
- **Support Multi-fichiers** : Chargez les tâches depuis plusieurs fichiers markdown dans un dossier configuré
- **Mises à Jour en Direct** : Le tableau se rafraîchit automatiquement quand les fichiers sont modifiés
- **Configuration Flexible** : Configurez le dossier et le titre de section à surveiller

## Utilisation

### Configuration Initiale

1. Installez le plugin dans votre vault Obsidian
2. Ouvrez les paramètres du plugin et configurez :
   - **Chemin du Dossier** : Chemin du dossier contenant vos fichiers de tâches
   - **Titre de Section** : Le titre sous lequel les tâches sont listées (ex: "## Tâches")
3. Cliquez sur l'icône Kanban dans le ruban pour ouvrir le tableau Daily Kanban

### Format des Tâches

Les tâches doivent être formatées comme des cases à cocher markdown :

```markdown
## Tâches

- [b] Tâche en backlog
- [ ] Tâche à faire
- [/] Tâche en cours
- [x] Tâche terminée
```

### Tags de Priorité

Ajoutez des badges de priorité à vos tâches en utilisant des tags :

```markdown
## Tâches

- [ ] Implémenter la fonctionnalité #MIT
- [ ] Écrire la documentation #I
- [ ] Relire le code #NI
```

**Niveaux de Priorité :**
- **#MIT** - À faire absolument (Badge rouge)
- **#I** - Important (Badge jaune)
- **#NI** - Souhaitable (Badge vert)

Le texte du tag sera supprimé du titre de la tâche et affiché comme un badge coloré sur la carte Kanban.

### Interactions

- **Glisser-déposer** : Déplacez les cartes entre les colonnes
- **Clic** : Cliquez sur une carte pour parcourir les statuts (backlog → à faire → en cours → terminé)
- **Sauvegarde Automatique** : Les modifications sont automatiquement sauvegardées dans vos fichiers markdown

## Développement

### Installation

- Clonez ce dépôt
- Assurez-vous que votre NodeJS est au minimum v16 (`node --version`)
- Exécutez `npm i` pour installer les dépendances
- Exécutez `npm run dev` pour compiler en mode surveillance
- Exécutez `npm run build` pour créer une build de production

### Installation Manuelle

1. Copiez `main.js`, `styles.css` et `manifest.json` dans le dossier des plugins de votre vault :
   ```
   DossierVault/.obsidian/plugins/daily-kanban/
   ```
2. Rechargez Obsidian ou redémarrez-le
3. Activez le plugin dans Paramètres > Plugins communautaires

### Qualité du Code

- Exécutez `npm run lint` pour vérifier la qualité du code avec ESLint
- ESLint est pré-configuré avec les directives spécifiques à Obsidian

## Support

Pour les problèmes, les bugs ou les demandes de fonctionnalités, veuillez ouvrir une issue sur GitHub.
