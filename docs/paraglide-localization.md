# Paraglide URL Localization Guide

## Overview

To ensure proper language prefixes in all URLs across the application, we need to use Paraglide's `localizeHref` function for all internal links. This document provides implementation guidelines and examples.

## Implementation Options

### Option 1: Use localizeHref directly

```typescript
import { localizeHref } from '$lib/paraglide/runtime';
```

**Before:**
```html
<a href="/products">Products</a>
```

**After:**
```html
<a href={localizeHref('/products')}>Products</a>
```

### Option 2: Use the Localized Components (Recommended)

For convenience, we've created two components that automatically localize URLs:

#### LocalizedLink

```typescript
import LocalizedLink from '$lib/components/ui/localized-link.svelte';
```

**Usage:**
```html
<LocalizedLink href="/products">Products</LocalizedLink>
```

#### LocalizedButton

```typescript
import LocalizedButton from '$lib/components/ui/localized-button.svelte';
```

**Usage:**
```html
<LocalizedButton href="/products" variant="default">Products</LocalizedButton>
```

These components automatically:
- Apply localization to internal URLs
- Leave external URLs unchanged
- Support all the same props as the original components

## Implementation Steps

### 1. Choose your approach

- For quick updates to existing code, use `localizeHref` directly
- For new code or comprehensive updates, consider using the localized components

### 2. Replace static href values

**Before:**
```html
<a href="/products">Products</a>
<Button href="/cart">Cart</Button>
```

**After with localizeHref:**
```html
<a href={localizeHref('/products')}>Products</a>
<Button href={localizeHref('/cart')}>Cart</Button>
```

**After with components:**
```html
<LocalizedLink href="/products">Products</LocalizedLink>
<LocalizedButton href="/cart">Cart</LocalizedButton>
```

### 3. For dynamic routes, use string interpolation

**Before:**
```html
<a href={`/products/${product.slug}`}>Product Detail</a>
```

**After with localizeHref:**
```html
<a href={localizeHref(`/products/${product.slug}`)}>Product Detail</a>
```

**After with components:**
```html
<LocalizedLink href={`/products/${product.slug}`}>Product Detail</LocalizedLink>
```

### 4. Don't worry about external links

Both `localizeHref` and our localized components automatically handle:
- External links (starting with http://, https://, etc.)
- Email links (mailto:)
- Anchor links (#section)
- JavaScript links (javascript:)

## Usage Examples

### Basic Link
```html
<LocalizedLink href="/about">About</LocalizedLink>
```

### Button Component
```html
<LocalizedButton href="/products" variant="default">Products</LocalizedButton>
```

### Dynamic Routes
```html
<LocalizedLink href={`/products/${product.slug}`}>View Product</LocalizedLink>
```

### Query Parameters
```html
<LocalizedLink href={`/search?q=${searchTerm}`}>Search Results</LocalizedLink>
```

### Computed URLs
```typescript
const loginUrl = $derived(() => {
  return currentPath === '/' 
    ? '/auth/login'
    : `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
});

// Usage:
<LocalizedButton href={loginUrl()}>Login</LocalizedButton>
```

## Files Updated So Far

We've updated several key components to use localization:

1. Navbar (`src/lib/components/navbar.svelte`)
2. Footer (`src/lib/components/footer.svelte`) 
3. Auth Section (`src/lib/components/auth-section.svelte`)
4. Cart Icon (`src/lib/components/cart-icon.svelte`)
5. Product Card (`src/lib/components/product-card.svelte`)
6. Product Detail Keyboard (`src/lib/components/product-detail-keyboard.svelte`)
7. Product Detail Accessory (`src/lib/components/product-detail-accessory.svelte`)
8. Error Page (`src/routes/+error.svelte`)

We've also created two new localized components:
1. `src/lib/components/ui/localized-link.svelte` - Wrapper for `<a>` tags
2. `src/lib/components/ui/localized-button.svelte` - Wrapper for the Button component

## Next Steps

1. Continue updating any remaining components with links
2. Consider migrating to the localized components for new code
3. Test all localized links in different languages

## Testing

After updating links to use localization, you should test that:

1. Links work correctly when visiting the site in different languages
2. Language is maintained when navigating between pages
3. Links include the proper language prefix (e.g., `/de/products` when in German)
4. Deep links work properly with localization 
5. Localized components work correctly with both internal and external links 