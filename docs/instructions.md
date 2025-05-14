You are an expert full-stack developer. Toghether we will craft code for a complete online shop for a split keyboard targeted at enthusiasts and tech affine clients. The project is built using Svelte 5 (or SvelteKit if appropriate) with Tailwind 4 CSS, the design must reflect the visual style of https://syntax.fm – that is, a modern, minimal, and beautifully typographed dark-themed layout with spacious padding, elegant typography, and an intuitive UI. Find more technology specific instructions in the .cursorrules file.

The framework is already set up. Please generate only the new or modified files/components. We will go feature by feature. First think step-by-step - describe your plan for what to build in pseudocode, wait my confirmation before writing out in great detail.

The site must include the following features:

1. **Layout & Navigation**

   - A global layout component (e.g., `+layout.svelte` or `App.svelte`) that includes a navigation bar and a footer.
   - The navigation bar should have links to Home, Shop, About, and Cart.
   - The design of these components should incorporate Tailwind CSS classes inspired by syntax.fm’s colors, spacing, and typography.

2. **Home Page**

   - A hero section that prominently shows the split keyboard with a “Shop Now” call-to-action button.
   - Use background images or gradients that are aligned with the syntax.fm aesthetic.
   - Provide concise text content that welcomes enthusiasts and directs them to the shop page.

3. **Shop Page**

   - A product grid displaying available products (initially, you can list one featured split keyboard along with placeholders for other products).
   - Each product card should include an image (use a placeholder image or a URL to an unsplash image that fits the theme), title, description, price, and an “Add to Cart” button.
   - Implement hover/focus animations using Tailwind CSS utilities.

4. **Product Detail Page**

   - A component that shows additional details for a particular product when clicked.
   - Include multiple images (if applicable), detailed specs, price, and an “Add to Cart” button.
   - Ensure responsiveness and accessibility.

5. **Shopping Cart Page**

   - A page where users can review added items, modify the quantity or remove items, and proceed to checkout.
   - Use Svelte’s reactivity to update the cart in real-time.
   - Include a checkout form for user billing/shipping information (functionality can use placeholders or simple state management for now).

6. **Styling and Interactivity**

   - Use Tailwind CSS for all styling. Ensure that custom classes or custom Tailwind configuration is applied so that colors, typography, and spacing reflect the dark minimal style as found on syntax.fm.
   - The user interface should be mobile responsive and include animations or transitions where appropriate.
   - Use Svelte stores or context (if using SvelteKit) for managing state like the cart contents.

7. **Other Considerations**
   - Include placeholder content for product data, and ensure that code organization is modularized into components.
   - Write clean, maintainable code with proper comments.
   - If routing is part of the system (e.g., using SvelteKit’s file-based routing), ensure that URLs are friendly and components are properly organized.
   - Provide a brief explanation for any assumptions you make on data structure or state management within the project.

Generate all the necessary Svelte components, pages, and any store/configuration changes. Do not provide boilerplate installation or project setup code; assume the existing framework is pre-configured with Svelte and Tailwind CSS.

Thank you.
