# UI UX Pro Max

Design-intelligence skill for building polished, production-ready interfaces.

## When To Use

Use this skill for any task that changes how a product looks, feels, lays out, or behaves:

- New pages or screens, especially dashboards, SaaS products, admin panels, landing pages, and app flows
- New or redesigned components like cards, tables, modals, forms, charts, nav bars, and sidebars
- Style decisions involving spacing, typography, color, shadows, blur, motion, or visual hierarchy
- Accessibility reviews, responsive fixes, or interaction polish
- Design system creation or cleanup
- React and Tailwind implementation guidance for UI work

## Core Workflow

1. Understand the product
   - Identify product type, audience, platform, and style goals
   - Capture functional needs before choosing visuals

2. Define the design system first
   - Establish color palette, type scale, spacing, radius, shadows, blur, and motion
   - Keep the system consistent across the whole experience
   - Prefer semantic tokens over raw values in components

3. Design for accessibility by default
   - Maintain contrast ratios that are readable in real use
   - Keep focus states visible
   - Ensure keyboard access, touch target sizing, and screen-reader labels
   - Respect reduced motion

4. Make the layout responsive
   - Start mobile-first
   - Avoid horizontal scrolling
   - Use a clear breakpoint strategy
   - Reserve space for async content to avoid layout shift

5. Apply visual polish with restraint
   - Use glassmorphism, blur, gradients, and shadows only when they support clarity
   - Keep motion subtle and meaningful
   - Avoid decorative noise that hurts readability

6. Implement cleanly in code
   - Prefer reusable components
   - Keep state and layout predictable
   - Use TailwindCSS utility patterns consistently
   - Keep React components readable and composable

## Practical Checklist

- One primary action per screen
- Clear hierarchy from headline to secondary content
- No emoji-based structural icons
- Adequate spacing between interactive elements
- Visible loading, empty, and error states
- Responsive behavior tested for narrow, medium, and wide layouts
- Keyboard navigation works end to end
- Motion remains comfortable when reduced motion is enabled

## Good Defaults For Modern SaaS

- Background: soft gradient or subtle texture
- Surfaces: translucent cards with controlled blur and border treatment
- Typography: strong hierarchy with readable body text
- Layout: sidebar or top-nav structure with card-based content regions
- Data display: charts, metric cards, tables, and activity feeds
- Interaction: hover, focus, and pressed states that feel crisp but not flashy

## Output Expectations

When asked to create UI, aim for:

- A coherent design system
- A responsive layout that feels intentional on desktop and mobile
- Strong accessibility fundamentals
- A modern visual language that is polished, not generic
- Implementation guidance that can be turned directly into React and Tailwind code
