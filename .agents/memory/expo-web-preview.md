---
name: Expo web preview routing
description: A Replit Expo preview quirk affecting imported apps that use a tab-group as the default route.
---

For imported Expo apps with a tab-group default route, keep a direct root web route for the primary screen and redirect native platforms into the tab group.

**Why:** The managed web preview can mount the tab navigator and route component while painting the tab scene at zero height, even though Metro and React report no runtime error.

**How to apply:** Use a web-only root screen for preview visibility, preserve the native tab route with a platform redirect, and keep the Expo workflow running through the managed artifact workflow.