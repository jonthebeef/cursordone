---
title: Clean up sidebar after filter migration
status: todo
priority: medium
complexity: S
epic: ui-cleanup
dependencies:
  - implement-filter-bar-ui
  - implement-filter-persistence
tags:
  - enhancement
  - ui
  - cleanup
  - day 1
  - filter-bar-migration
created: "2024-01-21"
owner: AI
ref: TSK-236
---

# Clean up sidebar after filter migration

Clean up and optimize the sidebar UI after moving epic and tag filters to the new filter bar, while maintaining core navigation elements and preparing for future navigation items.

## Requirements

### Sidebar Cleanup

- Remove epic filter section
- Remove tag filter section
- Maintain docs section
- Preserve core navigation structure
- Optimize spacing and layout
- Update responsive behavior

### Navigation Structure

- Keep existing docs navigation
- Maintain space for future nav items
- Ensure proper section spacing
- Update navigation hierarchy
- Optimize mobile navigation

### Visual Updates

- Adjust sidebar width if needed
- Update section padding/margins
- Maintain consistent styling
- Update transition animations
- Ensure proper responsive behavior

### Code Cleanup

- Remove unused filter components
- Clean up related styles
- Remove deprecated event handlers
- Update type definitions
- Remove unused imports

### Components to Remove

```typescript
// Components
const removedComponents = [
  "components/ui/sidebar/epic-filter.tsx",
  "components/ui/sidebar/tag-filter.tsx",
  "components/ui/sidebar/filter-section.tsx",
  "components/ui/sidebar/filter-item.tsx",
];

// Styles
const removedStyles = [
  "styles/epic-filter.module.css",
  "styles/tag-filter.module.css",
  "styles/filter-section.module.css",
];

// Types
const removedTypes = ["types/epic-filter.ts", "types/tag-filter.ts"];

// Tests
const removedTests = [
  "tests/components/epic-filter.test.tsx",
  "tests/components/tag-filter.test.tsx",
  "tests/components/filter-section.test.tsx",
];
```

### Layout Specifications

```typescript
interface SidebarLayout {
  dimensions: {
    width: {
      desktop: "280px";
      tablet: "240px";
      mobile: "100%";
    };
    maxHeight: "100vh";
    sectionSpacing: "24px";
    itemSpacing: "8px";
  };
  padding: {
    container: "16px";
    section: "12px";
    item: "8px 12px";
  };
  margins: {
    section: "0 0 16px 0";
    item: "4px 0";
  };
}
```

### Test Update Strategy

```typescript
interface TestUpdates {
  removals: {
    files: string[];
    imports: string[];
    mocks: string[];
  };
  updates: {
    files: ["sidebar.test.tsx", "navigation.test.tsx", "layout.test.tsx"];
    coverage: {
      target: 90;
      include: ["sidebar/**/*.tsx", "navigation/**/*.tsx"];
    };
  };
  additions: {
    responsive: boolean;
    accessibility: boolean;
    performance: boolean;
  };
}
```

### Performance Metrics

```typescript
interface PerformanceImpact {
  bundle: {
    reduction: "~50KB";
    target: "< 200KB";
  };
  rendering: {
    initial: "< 100ms";
    interaction: "< 16ms";
  };
  memory: {
    reduction: "~2MB";
    target: "< 10MB";
  };
  metrics: {
    fcp: "< 1s";
    lcp: "< 2.5s";
    cls: "< 0.1";
  };
}
```

### Mobile Breakpoints

```typescript
const breakpoints = {
  mobile: "640px",
  tablet: "768px",
  desktop: "1024px",
  behavior: {
    mobile: "drawer",
    tablet: "collapsed",
    desktop: "expanded",
  },
  animation: {
    duration: "200ms",
    timing: "ease-in-out",
    properties: ["width", "transform"],
  },
};
```

## Success Criteria

- [ ] Sidebar renders cleanly without filter sections
- [ ] Docs navigation works as expected
- [ ] Sidebar width and spacing is optimized
- [ ] Mobile responsiveness is maintained
- [ ] No console errors or warnings
- [ ] No unused code remains
- [ ] All transitions are smooth
- [ ] Navigation hierarchy is clear
- [ ] Future nav items can be easily added
- [ ] Responsive behavior works correctly
- [ ] Bundle size reduced by expected amount
- [ ] Performance metrics meet targets
- [ ] All tests pass with updated coverage
- [ ] Mobile breakpoints work correctly

## Implementation Details

### Component Updates

```typescript
// Update these components:
-components / ui / sidebar.tsx -
  components / ui / sidebar -
  section.tsx -
  components / ui / nav -
  item.tsx;
```

### Style Updates

```typescript
// Update these style modules:
-styles / sidebar.module.css - styles / nav.module.css;
```

### Code Removal

- Remove filter-related event handlers
- Clean up filter-related types
- Remove unused style classes
- Clean up related tests

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
