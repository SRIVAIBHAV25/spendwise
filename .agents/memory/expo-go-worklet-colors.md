---
name: Expo Go worklet colors
description: Native Expo Go failures caused by ordinary color helpers being captured inside Reanimated worklets.
---

Calculate alpha colors and other derived values before passing them into `useAnimatedStyle`; keep worklet callbacks limited to UI-runtime-safe operations and captured primitives.

**Why:** Expo Go’s React Native Worklets runtime throws when a normal JavaScript helper is invoked from a UI-thread style updater, which can crash shared selection transitions across multiple screens.

**How to apply:** Precompute colors during render, then pass those strings into `interpolateColor` or use them in static styles. Search every animated style callback when adding a new shared UI helper.