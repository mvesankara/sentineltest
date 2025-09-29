# Guide Utilisateur de SentinelleChain

Bienvenue sur SentinelleChain, votre plateforme de cybersécurité pour la détection des menaces en temps réel, l'analyse des logs et la gestion des alertes, avec une preuve d'existence des données critiques ancrée sur la blockchain.

Ce guide vous aidera à prendre en main les fonctionnalités clés de l'application.

## Table des matières

1.  [Premiers Pas](#1-premiers-pas)
    *   [Inscription de votre entreprise](#inscription-de-votre-entreprise)
    *   [Connexion](#connexion)
2.  [Le Tableau de Bord](#2-le-tableau-de-bord)
    *   [Widgets de Métriques](#widgets-de-métriques)
    *   [Dernières Alertes](#dernières-alertes)
3.  [Gestion des Alertes](#3-gestion-des-alertes)
    *   [Filtrer les Alertes](#filtrer-les-alertes)
    *   [Consulter les Détails d'une Alerte](#consulter-les-détails-dune-alerte)
    *   [Changer le Statut d'une Alerte](#changer-le-statut-dune-alerte)
4.  [Preuve sur la Blockchain](#4-preuve-sur-la-blockchain)
5.  [Piste d'Audit](#5-piste-daudit)
6.  [Exporter les Alertes](#6-exporter-les-alertes)
7.  [Paramètres du Compte](#7-paramètres-du-compte)
    *   [Changer de Thème](#changer-de-thème)
    *   [Clé API](#clé-api)

---

### 1. Premiers Pas

#### Inscription de votre entreprise

Si vous êtes un nouvel utilisateur, la première étape est d'inscrire votre entreprise.

1.  Sur la page de connexion, cliquez sur le lien **"S'inscrire"**.
2.  Remplissez les champs suivants :
    *   **Nom de l'entreprise** : Le nom de votre organisation.
    *   **Votre email** : Votre adresse email professionnelle.
    *   **Mot de passe** : Choisissez un mot de passe sécurisé.
3.  Cliquez sur **"Créer un compte"**. Vous serez redirigé vers la page de connexion.

#### Connexion

Une fois votre compte créé, vous pouvez vous connecter :

1.  Saisissez l'adresse email et le mot de passe que vous avez utilisés lors de l'inscription.
2.  Cliquez sur **"Se connecter"**. Vous accéderez alors au tableau de bord principal.

### 2. Le Tableau de Bord

Le tableau de bord est votre page d'accueil. Il vous donne un aperçu en temps réel de l'état de la sécurité de votre système.

#### Widgets de Métriques

En haut de la page, vous trouverez plusieurs widgets affichant des statistiques clés :
*   **Alertes Ouvertes** : Le nombre total d'alertes avec le statut "Nouveau" ou "Reconnu".
*   **Alertes Critiques** : Le nombre d'alertes ouvertes avec une sévérité "CRITICAL".
*   **Logs Ingestés (24h)** : Le volume de logs que le système a reçus au cours des dernières 24 heures.

Ces chiffres se mettent à jour dynamiquement.

#### Dernières Alertes

Juste en dessous des métriques, vous verrez une liste des alertes de sécurité les plus récentes. Chaque carte d'alerte affiche :
*   La sévérité (ex: CRITICAL, HIGH).
*   Un résumé du log qui a déclenché l'alerte.
*   L'heure de l'alerte.

### 3. Gestion des Alertes

La page **"Alertes"**, accessible depuis le menu de navigation, est votre centre de commandement pour analyser et traiter toutes les menaces détectées.

#### Filtrer les Alertes

Utilisez les filtres en haut de la page pour affiner la liste des alertes :
*   **Filtrer par sévérité** : Affichez uniquement les alertes d'un certain niveau (ex: "HIGH").
*   **Filtrer par statut** : Affichez les alertes en fonction de leur état de traitement (Nouveau, Reconnu, Résolu, Rejeté).

#### Consulter les Détails d'une Alerte

Cliquez sur n'importe quelle alerte dans le tableau pour ouvrir une fenêtre modale avec des informations détaillées :
*   **Contenu du Log** : Le log brut qui a déclenché l'alerte.
*   **Informations de l'IA** : Le niveau de confiance de l'IA et la règle qui a été enfreinte.
*   **Preuve Blockchain** : Le hash de la transaction sur la blockchain qui ancre l'existence de cette alerte.

#### Changer le Statut d'une Alerte

Dans la vue détaillée, vous pouvez mettre à jour le statut d'une alerte pour suivre sa résolution. Les statuts disponibles sont :
*   **Nouveau** : Statut par défaut. L'alerte n'a pas encore été examinée.
*   **Reconnu** : Vous avez vu l'alerte et enquêtez dessus.
*   **Résolu** : L'incident a été traité et résolu.
*   **Rejeté** : L'alerte est un faux positif ou non pertinente.

### 4. Preuve sur la Blockchain

Pour les alertes critiques, SentinelleChain ancre une preuve de leur existence sur la blockchain Polygon. Dans les détails de l'alerte, vous trouverez un **hash de transaction**. Ce hash est une preuve immuable et vérifiable que l'alerte a bien été générée à un moment précis.

### 5. Piste d'Audit

La page **"Audit Trail"** enregistre les actions importantes effectuées sur la plateforme pour garantir la traçabilité et la responsabilité. Vous y trouverez des informations sur :
*   Les connexions des utilisateurs.
*   La création de nouvelles alertes.
*   L'ingestion de logs.

### 6. Exporter les Alertes

Sur la page **"Rapports"**, vous pouvez exporter une liste d'alertes au format JSON. C'est utile pour l'archivage, l'analyse externe ou le partage avec d'autres équipes.

Utilisez les filtres pour sélectionner une plage de dates, un statut ou une sévérité, puis cliquez sur **"Exporter en JSON"** pour télécharger le fichier.

### 7. Paramètres du Compte

#### Changer de Thème

L'interface prend en charge un thème clair et un thème sombre. Cliquez sur l'icône de lune ou de soleil en haut à droite pour basculer entre les deux modes.

#### Clé API

Votre entreprise dispose d'une clé API unique pour envoyer des logs à la plateforme. Vous pouvez la trouver sur la page "Paramètres". Utilisez cette clé dans vos scripts et agents de collecte de logs pour vous authentifier auprès de l'endpoint d'ingestion de SentinelleChain.