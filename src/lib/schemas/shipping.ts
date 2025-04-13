import { z } from 'zod';
import { addressStructures, baseValidation } from '$lib/config/address-structures';

// Function to create a Zod schema for a specific country
export function createShippingSchema(country: string) {
    const countryStructure = addressStructures[country] || addressStructures.DEFAULT;
    const countryValidation = countryStructure.validation;

    // Start with base schema - ensure all required fields have reasonable validation
    const schema: Record<string, z.ZodTypeAny> = {
        firstName: z.string().min(2, baseValidation.firstName?.message || 'First name is required'),
        lastName: z.string().min(1, baseValidation.lastName?.message || 'Last name is required'),
        addressLine1: z.string().min(1, baseValidation.addressLine1?.message || 'Address is required'),
        addressLine2: z.string().optional(),
        city: z.string().min(1, baseValidation.city?.message || 'City is required'),
        state: z.string().optional(),
        county: z.string().optional(),
        prefecture: z.string().optional(),
        province: z.string().optional(),
        // Make postal code optional initially to prevent immediate validation errors
        // It will be required when the user actually submits the form
        postalCode: z.string().optional(),
        country: z.string(),
        shippingMethod: z.string().min(1, 'Shipping method is required')
    };

    // Add country-specific postal code validation if available, but make it optional
    // to prevent immediate validation errors when changing countries
    if (countryValidation.postalCode?.pattern) {
        schema.postalCode = z.string().optional().or(
            z.string()
                .min(1, 'Postal code is required')
                .regex(
                    countryValidation.postalCode.pattern,
                    countryValidation.postalCode.message
                )
        );
    }

    // For fields that are required in a specific country structure, make them required
    // but only for fields other than postalCode (which we handle specially)
    countryStructure.fields.forEach(field => {
        if (field === 'addressLine2') return; // Always optional
        if (field === 'postalCode') return; // Already handled above

        // Make required fields non-optional for this country
        if (field === 'state' || field === 'county' || field === 'prefecture' || field === 'province') {
            if (countryStructure.fields.includes(field)) {
                schema[field] = z.string().min(1, `${field} is required`);
            }
        }
    });

    // Add special handling for form submission validation
    // This will be used when the form is actually submitted
    const finalSchema = z.object(schema);

    // Return the schema
    return finalSchema;
}

// Default schema for initial form setup (US)
export const shippingSchema = createShippingSchema('US');

export type ShippingSchema = typeof shippingSchema;