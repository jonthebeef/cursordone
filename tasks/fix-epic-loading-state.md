---
title: Fix infinite loading state in Marketing epic view
status: done
priority: high
complexity: S
category: bug
owner: AI
created: 2025-01-21T00:00:00.000Z
epic: marketing-website
tags:
  - bug
  - ui
  - performance
  - epic
ref: TSK-233
completion_date: "2025-01-21"
---

# Fix infinite loading state in Marketing epic view

Fix the infinite loading state that occurs when viewing tasks in the Marketing epic.

## Issue Details

- Marketing epic shows perpetual loading spinner
- No tasks are displayed
- Other epics load correctly
- Likely related to the React infinite update loop error

## Root Cause Analysis

Potential causes:

1. Task loading state not being reset
2. Infinite loop in task fetching
3. Error in task filtering for Marketing epic
4. State management issue with epic/task relationship

## Implementation Details

1. Debug task loading flow:

   ```typescript
   // components/task-list.tsx or similar
   const [loading, setLoading] = useState(false);
   const [tasks, setTasks] = useState<Task[]>([]);

   useEffect(() => {
     const loadTasks = async () => {
       try {
         setLoading(true);
         const epicTasks = await getAllTasks(epicId);
         setTasks(epicTasks);
       } catch (error) {
         console.error("Failed to load tasks:", error);
       } finally {
         setLoading(false);
       }
     };

     loadTasks();
   }, [epicId]); // Ensure proper dependencies
   ```

2. Add error boundaries:

   ```typescript
   // components/epic-error-boundary.tsx
   class EpicErrorBoundary extends React.Component {
     state = { hasError: false, error: null }

     static getDerivedStateFromError(error) {
       return { hasError: true, error }
     }

     render() {
       if (this.state.hasError) {
         return (
           <div className="p-4 text-red-500">
             <h3>Error loading tasks</h3>
             <button onClick={() => window.location.reload()}>
               Retry
             </button>
           </div>
         )
       }
       return this.props.children
     }
   }
   ```

3. Add loading timeout:

   ```typescript
   // hooks/use-loading-timeout.ts
   function useLoadingTimeout(loading: boolean, timeout = 5000) {
     const [showError, setShowError] = useState(false);

     useEffect(() => {
       if (!loading) {
         setShowError(false);
         return;
       }

       const timer = setTimeout(() => {
         setShowError(true);
       }, timeout);

       return () => clearTimeout(timer);
     }, [loading, timeout]);

     return showError;
   }
   ```

4. Improve error handling:
   ```typescript
   // lib/tasks.ts
   export async function getEpicTasks(epicId: string) {
     try {
       const tasks = await getAllTasks();
       return tasks.filter((task) => task.epic === epicId);
     } catch (error) {
       console.error(`Failed to load tasks for epic ${epicId}:`, error);
       throw new Error(`Failed to load epic tasks: ${error.message}`);
     }
   }
   ```

## Success Criteria

- [ ] Marketing epic loads tasks correctly
- [ ] Loading state resolves within reasonable time
- [ ] Error states are handled gracefully
- [ ] No infinite loading states
- [ ] Loading state matches other epics
- [ ] Performance impact verified
- [ ] Error boundaries catch potential issues

## Dependencies

- Related to task: fix-infinite-update-loop.md

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
