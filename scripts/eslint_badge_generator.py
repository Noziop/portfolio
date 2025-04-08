import json
import os
import sys

import requests


def generate_eslint_badge(json_report_path, output_svg_path):
    # Charger le rapport JSON ESLint
    with open(json_report_path, "r") as f:
        report = json.load(f)

    # Calculer les erreurs et avertissements
    error_count = sum(file.get("errorCount", 0) for file in report)
    warning_count = sum(file.get("warningCount", 0) for file in report)

    # Déterminer le statut et la couleur du badge
    if error_count > 0:
        status = "failing"
        color = "red"
    elif warning_count > 0:
        status = "warnings"
        color = "yellow"
    else:
        status = "passing"
        color = "brightgreen"

    # Générer l'URL du badge
    badge_url = f"https://img.shields.io/badge/ESLint-{status}-{color}"

    # Télécharger le badge SVG
    response = requests.get(badge_url)
    response.raise_for_status()

    # Créer le répertoire de sortie si nécessaire
    os.makedirs(os.path.dirname(output_svg_path), exist_ok=True)

    # Sauvegarder le badge SVG
    with open(output_svg_path, "wb") as f:
        f.write(response.content)

    print(f"Badge généré: {output_svg_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            "Usage: python eslint_badge_generator.py "
            "<chemin_rapport_json> <chemin_sortie_svg>"
        )
        sys.exit(1)

    generate_eslint_badge(sys.argv[1], sys.argv[2])
