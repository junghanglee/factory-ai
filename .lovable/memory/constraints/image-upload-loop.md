---
name: Image upload infinite loop prevention
description: Uploading state must use refs, not useCallback deps, to prevent re-render loops in ImageUploader/MultiImageUploader
type: constraint
---
**Problem**: `uploading` state in useCallback dependency array causes function recreation on every state change, leading to cascading re-renders and infinite loops during file upload.

**Fix applied**:
1. Use `uploadingRef` (ref) for the guard check inside `upload`, NOT `uploading` (state) in the dependency array
2. `uploading` state is only for UI rendering (spinner, disabled state)
3. `uploadingRef.current` is set BEFORE `setUploading()` to prevent race conditions
4. MultiImageUploader: stabilize `value` prop with `useMemo` + `JSON.stringify` to prevent referential instability from `form.portfolio_images || []`
5. Use `EMPTY_ARRAY` constant for empty fallback instead of creating `[]` each render

**Files**: `src/components/admin/ImageUploader.tsx`, `src/components/admin/MultiImageUploader.tsx`

**Why**: This bug occurred twice. The pattern of putting mutable state (`uploading`) in useCallback deps while also setting that state inside the callback creates a loop where state change → new callback → potential re-trigger.
