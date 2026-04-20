# Pyramid Support Pages Content Refresh Design

**Date:** 2026-04-21
**Branch Context:** `feature/support-pages-content-refresh`
**Status:** Draft for user review

## Goal

Replace the placeholder support and legal page copy with real authored content, remove the redundant secondary navigation control, and align the support-page experience with the museum-editorial tone already established on the landing page.

This pass is not a landing-page redesign. It is a content and structure refinement for the secondary routes that now sit behind the footer and support navigation.

## Scope

### Included

- Real authored content for:
  - `/about`
  - `/contact`
  - `/faq`
  - `/license`
  - `/privacy-policy`
  - `/terms-of-service`
- A single-author voice across the support pages:
  - `Sofiane Zidane Ben Taleb`
  - `sofiane.zidane.bentaleb@gmail.com`
  - `https://www.linkedin.com/in/sofiane-ben-taleb/`
  - `https://github.com/gamween`
  - `https://x.com/dvb_fianso`
  - `t.me/dvb_fianso`
- A restrained portrait treatment on `About us` only, using the image currently placed at the repository root.
- Removal of the top-left `At All Times` return control and the supporting code paths behind it.
- Support-page regressions updated to reflect:
  - the simplified shared layout
  - the new content model
  - the removed navigation layer

### Excluded

- Changes to the main landing narrative structure.
- Changes to the internal `/app` product experience.
- New protocol features or API behavior.
- A rewrite of the educational `/learn/*` pages in this pass.

## Authorship And Voice

All support pages should now present Pyramid as the work of one builder:

- **Author:** Sofiane Zidane Ben Taleb
- **Canonical repo owner:** `gamween`
- **Primary contact:** `sofiane.zidane.bentaleb@gmail.com`

This change applies across the support-page surface. The pages should no longer imply an active team, association, or studio voice for this repo.

The only historical reference that remains is a short origin note explaining that this repository can acknowledge its relationship to the earlier forked project:

- old repo: `https://github.com/DVB-ESILV/Pyramid`
- context: a project built with Florian Gallot and Mehdi Mateo Tazi for Hack the Block 2026
- hackathon reference: `https://github.com/XRPL-Commons/2026-PBW-Hackathon`

That note should stay short and subordinate to the current reality: this app and this repo are authored and maintained by Sofiane alone.

## Experience Principles

### 1. Hybrid editorial, not empty placeholders

The support pages should stay airy and readable, but they must now contain useful information. The right level is not legal boilerplate and not one-line placeholders; it is concise, factual, readable content.

### 2. Museum tone, not corporate SaaS

These pages should feel like part of the same site as the landing page: open spacing, clear sectioning, restrained rhythm, and typographic confidence. They should not read like generic startup policies or cookie-cutter docs.

### 3. Truth over performance

The `Privacy Policy` and `Terms of Service` must be narrow and factual. They should describe the actual site and app surface as it exists today, not pretend there is a larger compliance system or legal framework than the project truly has.

### 4. Pyramid remains the only return path

The floating `At All Times` control is redundant. The `Pyramid` mark in the shared header already returns visitors to the landing page, so the secondary control should be removed entirely rather than merely hidden.

## Route Set

The support-page family remains:

- `/about`
- `/contact`
- `/faq`
- `/license`
- `/privacy-policy`
- `/terms-of-service`

These pages continue to share a single content layout and footer, but they should no longer reserve space for any extra floating navigation.

## Page Content Design

## `/about`

Purpose:
- introduce Sofiane clearly
- explain why Pyramid exists
- connect the product to XRPL-native design thinking
- acknowledge the earlier fork in a short historical note

Planned structure:

### Intro

First-person, concise, personal without becoming autobiographical. It should explain that Pyramid is a product thesis about building directly with XRPL-native primitives rather than layering a synthetic protocol on top.

### Section 1: Who I am

This section introduces Sofiane Zidane Ben Taleb as the sole builder of the current repo and app. It should mention interests in XRPL-native product design, protocol composition, and readable interfaces.

### Section 2: Why I built Pyramid

This section explains the core thesis:

- native lending, trading, and privacy belong in one readable product surface
- XRPL primitives should be presented as the product itself, not hidden behind abstractions
- the site exists both to present the app and to teach the underlying mechanisms

### Section 3: Origin note

A short section explains that the current repository descends from an earlier forked hackathon project built with Florian Gallot and Mehdi Mateo Tazi for Hack the Block 2026, but that the present app and repository are now maintained by Sofiane alone.

### Portrait treatment

The image currently stored at the repo root should be moved during implementation into a logical public asset path, with an English, searchable filename. It appears only on this page, in an editorial layout rather than a boxed profile card.

## `/contact`

Purpose:
- provide direct ways to reach Sofiane
- tell visitors what kinds of contact make sense

Planned structure:

### Intro

Short and direct. Visitors should understand they are reaching the builder directly.

### Section 1: Direct channels

This section should expose:

- email
- LinkedIn
- GitHub
- X
- Telegram

Links should be readable and intentional, not styled like aggressive utility buttons.

### Section 2: What to contact me about

Examples:

- XRPL-native product discussion
- technical questions about Pyramid
- hackathon follow-up
- collaboration, demos, or research conversation

## `/faq`

Purpose:
- reduce repeated confusion points
- answer the questions the landing page naturally creates

Planned question set:

- What is Pyramid?
- Is Pyramid built by one person or a team?
- What is live in the app today?
- What part of Pyramid is educational content?
- What do XLS-65 and XLS-66 add to XRPL?
- Why does the site link to XRPL and Boundless documentation?
- Is Boundless part of XRPL?
- What is the relationship between this repo and the earlier hackathon project?

The answers should stay short and factual, with no placeholder phrasing.

## `/license`

Purpose:
- keep the full repository license text
- add a short human explanation before the raw text

Planned structure:

### Intro

Explain that the code in this repository is distributed under the repo license and that linked external resources remain governed by their own licenses and terms.

### Section 1: How to read this page

Short explanation of what the license covers and what it does not cover.

### Section 2: Full license text

The current rendered LICENSE content remains.

## `/privacy-policy`

Purpose:
- state what the public site actually does with data
- avoid fake legal theater

Planned structure:

### Intro

Describe the site as a lightweight public presentation surface and clarify that the page reflects current behavior rather than generic template language.

### Section 1: What this site currently collects

This section should remain narrow and truthful. If the site does not currently operate user accounts, form submissions, or custom analytics beyond normal hosting/platform behavior, it should say so plainly.

### Section 2: Direct contact information

Explain that if a visitor emails or messages Sofiane directly, the information they voluntarily send is used only to respond and continue the conversation.

### Section 3: Third-party destinations

Clarify that external links, the live app route, hosting platforms, wallet software, social links, and third-party documentation have their own privacy behavior outside this site.

## `/terms-of-service`

Purpose:
- clarify the scope of the public site and live app
- set expectations without overlawyering the page

Planned structure:

### Intro

Explain that Pyramid contains editorial product pages, educational material, and a live app route.

### Section 1: Informational nature of the site

Clarify that educational explanations and summaries on the site do not replace official protocol documentation or third-party terms.

### Section 2: App route and feature availability

Clarify that the `/app` route is the live product surface and may evolve independently from the editorial landing and support pages.

### Section 3: External links and third-party systems

Clarify that linked repositories, XRPL docs, Boundless docs, wallets, and social platforms are governed by their own terms and behavior.

## Shared Layout Cleanup

The following code should be removed entirely during implementation:

- `apps/web/components/site/AtAllTimesMenu.js`
- `shouldShowAtAllTimes()` in `apps/web/lib/site-content.js`
- `getAtAllTimesLinks()` in `apps/web/lib/site-content.js`
- layout and header code that only exists to reserve space for that control
- tests that only validate the old `At All Times` behavior

The shared content layout should become simpler:

- shared header
- page body
- shared footer

No floating secondary navigation.

## Asset Handling

The portrait file currently lives at the repository root as `fianso.jpg`. During implementation it should be moved to:

- `apps/web/public/about/sofiane-zidane-ben-taleb.jpg`

The new filename should be clear and searchable, reflecting the person shown rather than the original ad hoc root filename.

## Testing Strategy

Implementation should update tests to cover:

- removal of the `At All Times` menu and header reservation behavior
- presence of the expanded support page registry
- presence of the new support page routes
- continued license-page behavior
- support-page layout still composed through the shared content layout

The goal is not to snapshot copy. Tests should verify structure, route coverage, and the removal of the obsolete navigation layer.

## Open Decisions Resolved

- **Voice:** single-author, first-person where appropriate
- **Photo usage:** `About us` only
- **Origin note:** included, short, subordinate to the current repo identity
- **Writing density:** hybrid editorial
- **Return control:** removed entirely

## Implementation Summary

This pass should leave Pyramid with support and legal pages that feel finished rather than scaffolded, while also simplifying the code by removing the obsolete secondary navigation layer. The result should be cleaner both editorially and structurally.
