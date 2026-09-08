---
intent_id: INT-MF-0001
product_id: MF
product_name: MealFlow
trello_card_id: ari:cloud:trello::card/workspace/60b65d742dfa0a618795b3bb/6a932bfaedbe920e3e1b7638
trello_card_url: https://trello.com/c/CrzqQGRF/4-rename-product-from-menuapp-to-mealflow
intent_version: 3
status: New Ideas
git_commit: pending
content_hash: b705c395b3cd04d066ba004018a1fe986a8e31c8e43255daf3e1d43e40cd6af8
content_hash_scope: substantive intent sections, excluding traceability metadata
---

# Rename product from MenuApp to MealFlow

# Problem

The product and infrastructure still use the legacy name **MenuApp** in places. This creates an inconsistent identity, makes operational resources harder to recognize, and leaves users and maintainers unsure which name is authoritative.

# Current state

No implementation, validation, or delivery evidence is assumed. This intent defines the rename work before engineering begins.

# Desired outcome

**MealFlow** is the single, consistent product name wherever the application, its supporting infrastructure, and its documented operation identify the product. Existing persisted household data remains accessible through the transition.

# Scope

- Rename product-identifying UI text, metadata, code identifiers, files, and directories.
- Rename product-identifying configuration, package metadata, manifests, scripts, logs, health/status identifiers, and documentation.
- Rename deployment and infrastructure resources that identify this product, including Docker images, containers, Compose services, networks, volumes, paths, deployment scripts, and Synology configuration.
- Update tests, fixtures, and test data that identify the product.
- Provide and verify any required deployment, infrastructure, or persistence migration.

# Out of scope

- Functional changes unrelated to the product rename.
- Changing household recipes, saved ingredients, plans, or product preferences except as required to preserve them through the rename.
- Renaming the configured target GitHub repository, `dbacks95fan/menuapp`; that requires a separate repository-management decision.

# Constraints and assumptions

- Existing persisted data must remain accessible after deployment and restart.
- The work does not add checkout, payment, or unrelated Fry’s functionality.
- The configured target engineering repository remains `dbacks95fan/menuapp` unless a later decision changes it.

# Acceptance criteria

- A case-insensitive repository-wide search finds no obsolete `MenuApp` references that identify the product.
- UI, code, configuration, metadata, tests, scripts, logs, docs, files, directories, deployment resources, and infrastructure use `MealFlow` where they identify the product.
- No deployed resource remains named `MenuApp` when it represents MealFlow.
- The application builds, deploys, starts, and restarts successfully after the change.
- Existing persisted data remains accessible after the migration.
- Migration steps are documented and verified.

# Evidence required

- Executable Playwright coverage confirms MealFlow is shown throughout the UI, MenuApp is absent from the UI, and the page title uses MealFlow.
- Automated or controlled deployment evidence confirms persisted data remains available after deployment and restart.
- Repository-wide search evidence confirms the required rename scope.
