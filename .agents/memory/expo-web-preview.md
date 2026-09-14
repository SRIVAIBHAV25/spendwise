---
name: Expo web preview routing
description: A Replit Expo preview quirk affecting imported apps that use a tab-group as the default route.
---

For imported Expo apps with a tab-group default route, wrap the tab navigator in an explicit full-height view and route the web entry through the tab group.

**Why:** The managed web preview can mount the tab navigator and route component while painting the tab scene at zero height, even though Metro and React report no runtime error. Bypassing the group makes the Home screen visible but removes the bottom navigation.

**How to apply:** Keep the root entry redirecting to the tab group, give the tab layout a full-height wrapper, and let the tab bar render on both web and native platforms.