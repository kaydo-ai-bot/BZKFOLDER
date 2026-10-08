# BZK FOLDER 🥷 BY KAYDO BZK 🥷

**BZK FOLDER 🥷 BY KAYDO BZK 🥷** est une application web full-stack professionnelle, moderne et responsive, conçue pour la gestion d'un annuaire sécurisé de numéros de téléphone avec attribution automatique de badges BZK (`BZK 🥷🏿` pour les garçons, `BZK 🌸` pour les filles) et un fil de statuts éphémères sur 24 heures.

---

## 🚀 ÉTAPES DE CONFIGURATION ET DÉPLOIEMENT

### 1. Installer les Dépendances
```bash
npm install
```

### 2. Créer le Projet Firebase
- Rendez-vous sur la [Console Firebase](https://console.firebase.google.com/).
- Créez un nouveau projet nommé **BZK FOLDER BY KAYDO BZK**.

### 3. Configurer Firebase Authentication
- Activer **Authentication** dans la console Firebase.
- Activer le fournisseur **Email/Mot de passe** et/ou **Téléphone**.

### 4. Créer Firestore Database
- Dans la console Firebase, allez dans **Firestore Database**.
- Créez la base de données en mode de production ou de test.

### 5. Configurer Firebase Storage
- Activer **Cloud Storage** pour la sauvegarde des photos de profil et vidéos de statuts.

### 6. Ajouter les Security Rules
- Copiez le contenu de `firestore.rules` dans l'onglet **Règles** de Firestore.
- Copiez le contenu de `storage.rules` dans l'onglet **Règles** de Storage.

### 7. Configurer `ADMIN_ACCESS` (Secret Propriétaire)
- Définissez la variable d'environnement `ADMIN_ACCESS` dans votre environnement de déploiement (Vercel, Cloud Run ou `.env`).
- Exemple : `ADMIN_ACCESS="VotreCléSecrèteSuperRobuste2026"`

### 8. Configurer `GEMINI_API_KEY` (Optionnel pour l'IA Analytics)
- Obtenez une clé API sur Google AI Studio.
- Définissez `GEMINI_API_KEY="votre_cle_gemini"` dans vos variables d'environnement.

### 9. Tester Localement
```bash
npm run dev
```
Ouvrez `http://localhost:3000` pour tester l'inscription, la connexion, l'espace membre et l'espace administration (`/admin/login`).

### 10. Déployer sur Vercel
1. Installez la CLI Vercel ou connectez votre dépôt GitHub à [Vercel](https://vercel.com).
2. Configurez le Build Command : `npm run build`.
3. Configurez le Output Directory : `dist`.
4. Ajoutez les variables d'environnement dans le panneau Vercel Settings -> Environment Variables.

### 11. Vérifier l'Espace Administration
- Accédez à `/admin/login`.
- Entrez la clé configurée dans `ADMIN_ACCESS`.
- Accédez au tableau de bord, à la liste complète des contacts, à la modération des statuts, aux exports CSV/JSON et au journal d'audit `adminLogs`.

---

## 🔒 CHECKLIST DE SÉCURITÉ ET RECOMMANDATIONS EN PRODUCTION

1. **Secret ADMIN_ACCESS** : Ne placez jamais `ADMIN_ACCESS` dans le code frontend React. L'authentification admin est gérée exclusivement par le serveur via session HTTP-Only.
2. **Règles Firestore** : Ne jamais désactiver les règles de sécurité `firestore.rules`.
3. **Protection des Numéros** : Seul l'administrateur a accès aux numéros complets via les requêtes sécurisées.
