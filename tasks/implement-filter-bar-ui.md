---
title: Implement new filter bar UI component
status: todo
priority: high
complexity: L
epic: ui-cleanup
dependencies: []
tags:
  - enhancement
  - ui
  - filters
  - day 1
  - filter-bar-migration
created: "2024-01-21"
owner: AI
ref: TSK-249
---

# Implement new filter bar UI component

Create a new filter bar component that will replace the current sidebar epic and tag filtering with an inline filter system above the task list.

## Requirements

### Core Components

- Create new FilterBar container component
- Implement Epic selector dropdown
- Implement Tag ComboBox with search
- Add Size filter dropdown
- Add Category filter dropdown
- Add Date sorting options
- Add Urgent toggle
- Implement filter tag display system

### Filter Tag Display

- Show selected filters as removable tags
- Clear individual filters via tag close button
- Add "Clear all" button when filters are active
- Maintain proper spacing and wrapping
- Ensure mobile responsiveness

### State Management

- Integrate with existing filter persistence system
- Update URL parameters for shareable filtered views
- Handle filter combinations properly
- Implement AND/OR toggle for tag combinations
- Maintain filter state between sessions

### UI/UX Requirements

- Match existing design system
- Ensure proper spacing between filter elements
- Add hover and focus states
- Include loading states
- Add proper aria labels and roles
- Implement keyboard navigation
- Handle overflow gracefully on mobile

### Design System Integration

```typescript
// Color Tokens
const tokens = {
  bg: {
    primary: "bg-zinc-900",
    secondary: "bg-zinc-800",
    hover: "hover:bg-zinc-700",
  },
  text: {
    primary: "text-zinc-100",
    secondary: "text-zinc-400",
    hover: "hover:text-zinc-200",
  },
  border: {
    default: "border-zinc-700",
    focus: "focus:border-zinc-500",
  },
  spacing: {
    filterGap: "gap-2",
    containerPadding: "p-4",
    itemPadding: "px-3 py-2",
  },
};
```

### Accessibility Requirements

```typescript
// ARIA Roles and States
const ariaConfig = {
  filterBar: {
    role: "region",
    label: "Filter Controls",
  },
  combobox: {
    role: "combobox",
    hasPopup: "listbox",
    expanded: boolean,
  },
  filterTag: {
    role: "button",
    label: "Remove ${filter} filter",
  },
  clearAll: {
    role: "button",
    label: "Clear all filters",
  },
};
```

### Animation Specifications

```typescript
const animations = {
  dropdown: {
    enter: "transition-all duration-200 ease-out",
    exit: "transition-all duration-150 ease-in",
  },
  filterTag: {
    enter: "animate-fadeIn duration-200",
    exit: "animate-fadeOut duration-150",
  },
  loading: {
    spin: "animate-spin duration-1000 infinite",
    pulse: "animate-pulse duration-2000",
  },
};
```

### Loading States

```typescript
interface LoadingStates {
  initial: {
    skeleton: true;
    count: 4;
    width: "w-32";
  };
  filtering: {
    opacity: "opacity-50";
    spinner: true;
    disable: true;
  };
  tagSearch: {
    indicator: "spinner";
    debounce: 300;
  };
}
```

### Error Handling

```typescript
interface ErrorStates {
  validation: {
    message: string;
    appearance: "toast" | "inline";
    action?: () => void;
  };
  network: {
    retry: boolean;
    fallback: "cache" | "default";
  };
  overflow: {
    action: "wrap" | "scroll" | "collapse";
    indicator: boolean;
  };
}
```

## Success Criteria

- [ ] Filter bar renders correctly above task list
- [ ] All filter types (Epic, Tags, Size, Category, Date, Urgent) work as expected
- [ ] Selected filters display as removable tags
- [ ] AND/OR toggle for tags functions correctly
- [ ] Filter state persists between sessions
- [ ] UI is responsive on all screen sizes
- [ ] Keyboard navigation works properly
- [ ] All interactions have proper loading states
- [ ] URL parameters update with filter changes
- [ ] Clear all and individual clear functions work
- [ ] All accessibility requirements met
- [ ] Animations are smooth and performant
- [ ] Error states handled gracefully
- [ ] Design system tokens applied consistently

## Implementation Details

### Component Structure

```typescript
// components/ui/filter-bar/
-filter -
  bar.tsx - // Main container
  epic -
  select.tsx - // Epic dropdown
  tag -
  combobox.tsx - // Tag search/select
  size -
  select.tsx - // Size filter
  category -
  select.tsx - // Category filter
  date -
  select.tsx - // Date sorting
  urgent -
  toggle.tsx - // Urgent filter
  filter -
  tags.tsx; // Selected filter display
```

### State Interface

```typescript
interface FilterState {
  epic: string | null;
  tags: string[];
  tagMode: "AND" | "OR";
  size: string | null;
  category: string | null;
  dateSort: "newest" | "oldest" | null;
  urgent: boolean;
}
```

### URL Parameter Structure

```typescript
// URL format: ?epic=epic-name&tags=tag1,tag2&tagMode=AND&size=M&category=feature&date=newest&urgent=true
```

### Responsive Implementation

```typescript
interface ResponsiveConfig {
  breakpoints: {
    mobile: "max-width: 640px";
    tablet: "max-width: 768px";
    desktop: "min-width: 769px";
  };
  layouts: {
    mobile: {
      direction: "vertical";
      stackFilters: true;
      fullWidth: true;
      maxHeight: "70vh";
      overflow: "scroll";
    };
    tablet: {
      direction: "horizontal";
      wrapFilters: true;
      maxWidth: "100%";
      maxRows: 2;
    };
    desktop: {
      direction: "horizontal";
      wrapFilters: false;
      maxWidth: "calc(100% - 32px)";
      showAllFilters: true;
    };
  };
  interactions: {
    mobile: {
      expandable: true;
      collapseWhenFiltering: true;
      showSelectedFirst: true;
    };
    tablet: {
      expandable: false;
      scrollable: true;
      showMoreButton: true;
    };
    desktop: {
      expandable: false;
      showAll: true;
    };
  };
  animations: {
    mobile: {
      expand: "slide-down";
      collapse: "slide-up";
      duration: "200ms";
    };
    shared: {
      filterChange: "fade";
      duration: "150ms";
    };
  };
}
```

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
