import { z } from 'zod';
import { addressStructures, baseValidation } from '$lib/config/address-structures';

// Function to create a Zod schema for a specific country
export function createShippingSchema(country: string) {
    const countryStructure = addressStructures[country] || addressStructures.DEFAULT;
    const countryValidation = countryStructure.validation;

    // Start with base schema
    const schema: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {
        firstName: z.string().min(1, baseValidation.firstName?.message || ''),
        lastName: z.string().min(1, baseValidation.lastName?.message || ''),
        addressLine1: z.string().min(1, baseValidation.addressLine1?.message || ''),
        addressLine2: z.string().optional(),
        city: z.string().min(1, baseValidation.city?.message || ''),
        state: z.string().optional(),
        county: z.string().optional(),
        prefecture: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string(),
        country: z.string(),
        shippingMethod: z.string().min(1, 'Shipping method is required')
    };

    // Add country-specific postal code validation
    if (countryValidation.postalCode?.pattern) {
        schema.postalCode = z.string().regex(
            countryValidation.postalCode.pattern,
            countryValidation.postalCode.message
        );
    }

    // Make fields required based on country structure
    countryStructure.fields.forEach(field => {
        if (field === 'addressLine2') return; // Always optional
        if (field === 'postalCode') return; // Already handled above

        const validation = countryValidation[field];
        if (!validation) return;

        // Start with a fresh string validator for required fields
        let fieldSchema = z.string();

        if (validation.pattern) {
            fieldSchema = fieldSchema.regex(validation.pattern, validation.message);
        }
        if (validation.minLength) {
            fieldSchema = fieldSchema.min(validation.minLength, validation.message);
        }
        if (validation.maxLength) {
            fieldSchema = fieldSchema.max(validation.maxLength, validation.message);
        }

        // Update the schema with the new validator
        schema[field] = validation.required ? fieldSchema : fieldSchema.optional();
    });

    return z.object(schema);
}

// Default schema for initial form setup (US)
export const shippingSchema = createShippingSchema('US');

export type ShippingSchema = typeof shippingSchema; 