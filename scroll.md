Let me analyze all the CSS files and inline styles to understand why the scroll issue can't be corrected.

Read file: frontend/src/index.css
Read file: frontend/src/App.css
Read file: frontend/src/index.css
Now let me check the current state of the Login page to see the inline styles:

Read file: frontend/src/pages/Login.js
Read file: frontend/src/pages/Dashboard.js
Read file: frontend/src/pages/CardView.js
Now let me check the App.js to see how the overall layout is structured:

Read file: frontend/src/App.js
Now I can see the root cause of the scroll issue! Let me analyze all the conflicting CSS rules:

## **Root Cause Analysis:**

### **1. Global CSS Conflicts:**
```css
/* index.css */
body {
  overflow-y: auto;  /* ← This allows scrollbars globally */
}

* {
  color: #121111;  /* ← This affects all elements */
}
```

### **2. App.js Layout Structure:**
```jsx
<Box sx={{ 
  mt: { xs: 8, sm: 9, md: 10 },  /* ← Adds top margin */
  minHeight: 'calc(100vh - 80px)' /* ← Forces minimum height */
}}>
```

### **3. Page-Specific Conflicts:**

**Login.js:**
```jsx
<Box sx={{
  minHeight: '100vh',  /* ← Conflicts with App.js minHeight */
  overflow: 'hidden',  /* ← Tries to hide overflow */
  marginTop: '-64px',  /* ← Negative margin to compensate */
}}>
```

**Dashboard.js:**
```jsx
<Box sx={{
  minHeight: '100vh',  /* ← Conflicts with App.js minHeight */
  overflow: { xs: 'auto', sm: 'hidden' }, /* ← Responsive overflow */
  minHeight: { xs: 'auto', sm: '100vh' }, /* ← Duplicate minHeight */
}}>
```

**CardView.js:**
```jsx
<Box sx={{
  minHeight: '100vh',  /* ← Conflicts with App.js minHeight */
}}>
```

## **Why the Scroll Issue Can't Be Corrected:**

### **1. Multiple Height Definitions:**
- **App.js**: `minHeight: 'calc(100vh - 80px)'`
- **Pages**: `minHeight: '100vh'`
- **Result**: Pages try to be 100vh but App.js constrains them to `calc(100vh - 80px)`

### **2. Conflicting Overflow Rules:**
- **Global**: `overflow-y: auto` (allows scrollbars)
- **Pages**: `overflow: 'hidden'` (tries to hide scrollbars)
- **Responsive**: `overflow: { xs: 'auto', sm: 'hidden' }` (mobile vs desktop)

### **3. Margin/Padding Conflicts:**
- **App.js**: `mt: { xs: 8, sm: 9, md: 10 }` (adds top margin)
- **Pages**: `marginTop: '-64px'` (tries to compensate)
- **Result**: Inconsistent spacing calculations

### **4. Footer Positioning Issues:**
- Footer is positioned with `mt: 'auto'` but container heights are conflicting
- When `minHeight: '100vh'` conflicts with `calc(100vh - 80px)`, footer gets pushed out

## **The Solution:**

The issue is that **App.js is adding a wrapper with its own height constraints**, which conflicts with the page-specific height settings. The pages are trying to be 100vh but App.js is constraining them to `calc(100vh - 80px)`.

**To fix this, we need to either:**
1. Remove the App.js wrapper height constraints for these specific pages, OR
2. Make the pages work within the App.js constraints, OR  
3. Use a different approach that doesn't conflict with the App.js layout

The scrollbars appear because the content is exceeding the constrained height, and the conflicting overflow rules are fighting each other.