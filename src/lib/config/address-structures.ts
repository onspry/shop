import type { z } from 'zod';
import type { shippingSchema } from '$lib/schemas/shipping';
import * as m from '$lib/paraglide/messages';

export type ShippingFormType = z.infer<typeof shippingSchema>;

export type AddressField = 'firstName' | 'lastName' | 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'county' | 'prefecture' | 'province' | 'postalCode';

export interface FieldValidator {
    pattern?: RegExp;
    message: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
}

export type AddressValidation = Partial<Record<AddressField, FieldValidator>>;

export interface AddressLabels {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state?: string;
    county?: string;
    prefecture?: string;
    province?: string;
    postalCode: string;
}

export interface AddressPlaceholders {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state?: string;
    county?: string;
    prefecture?: string;
    province?: string;
    postalCode: string;
}

export interface AddressStructure {
    fields: AddressField[];
    labels: AddressLabels;
    placeholders: AddressPlaceholders;
    validation: AddressValidation;
}

// Base validators that can be reused
export const baseValidation: AddressValidation = {
    firstName: {
        required: true,
        minLength: 2,
        message: m.checkout_first_name()
    },
    lastName: {
        required: true,
        minLength: 2,
        message: m.checkout_last_name()
    },
    addressLine1: {
        required: true,
        minLength: 5,
        message: m.checkout_address()
    },
    city: {
        required: true,
        minLength: 2,
        message: m.checkout_city()
    }
}

export interface Country {
    value: string;
    label: string;
}

export const countries: Country[] = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    // EU Countries
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'PT', label: 'Portugal' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'BE', label: 'Belgium' },
    { value: 'IE', label: 'Ireland' },
    { value: 'DK', label: 'Denmark' },
    { value: 'SE', label: 'Sweden' },
    { value: 'FI', label: 'Finland' },
    { value: 'PL', label: 'Poland' },
    { value: 'CZ', label: 'Czech Republic' },
    { value: 'SK', label: 'Slovakia' },
    { value: 'HU', label: 'Hungary' },
    { value: 'RO', label: 'Romania' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'HR', label: 'Croatia' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'EE', label: 'Estonia' },
    { value: 'LV', label: 'Latvia' },
    { value: 'LT', label: 'Lithuania' },
    { value: 'CY', label: 'Cyprus' },
    { value: 'MT', label: 'Malta' },
    { value: 'GR', label: 'Greece' },
    { value: 'AT', label: 'Austria' },
    { value: 'LU', label: 'Luxembourg' },
    // Other European countries
    { value: 'IS', label: 'Iceland' },
    { value: 'NO', label: 'Norway' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'LI', label: 'Liechtenstein' },
    { value: 'MC', label: 'Monaco' },
    { value: 'AD', label: 'Andorra' },
    { value: 'SM', label: 'San Marino' },
    { value: 'VA', label: 'Vatican City' },
    // Other countries
    { value: 'AU', label: 'Australia' },
    { value: 'NZ', label: 'New Zealand' },
    { value: 'JP', label: 'Japan' }
];

export const addressStructures: Record<string, AddressStructure> = {
    US: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            state: m.checkout_state(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}(-\d{4})?$/,
                message: 'Please enter a valid US ZIP code (e.g., 10001 or 10001-1234)'
            }
        }
    },
    GB: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'county', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            county: m.checkout_county(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Flat 4B',
            city: 'London',
            county: 'Greater London',
            postalCode: 'SW1A 1AA'
        },
        validation: {
            postalCode: {
                pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
                message: 'Please enter a valid UK postcode (e.g., SW1A 1AA)'
            }
        }
    },
    CA: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            state: m.checkout_state(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5V 2T6'
        },
        validation: {
            postalCode: {
                pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
                message: 'Please enter a valid Canadian postal code (e.g., M5V 2T6)'
            }
        }
    },
    DE: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hauptstraße 123',
            addressLine2: 'Wohnung 4B',
            city: 'Berlin',
            postalCode: '10115'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid German postal code (5 digits)'
            }
        }
    },
    FR: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'prefecture', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            prefecture: m.checkout_prefecture(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Rue de Paris',
            addressLine2: 'Appartement 4B',
            city: 'Paris',
            prefecture: 'Paris',
            postalCode: '75001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid French postal code (5 digits)'
            }
        }
    },
    IT: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'province', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            province: m.checkout_province(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Via Roma 123',
            addressLine2: 'Appartamento 4B',
            city: 'Roma',
            province: 'RM',
            postalCode: '00100'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Italian postal code (5 digits)'
            }
        }
    },
    ES: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'province', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            province: m.checkout_province(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Calle Mayor 123',
            addressLine2: 'Piso 4B',
            city: 'Madrid',
            province: 'M',
            postalCode: '28001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Spanish postal code (5 digits)'
            }
        }
    },
    JP: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'prefecture', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            prefecture: m.checkout_prefecture(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '1-2-3 Shibuya',
            addressLine2: 'Room 4B',
            city: 'Shibuya-ku',
            prefecture: 'Tokyo',
            postalCode: '150-0002'
        },
        validation: {
            postalCode: {
                pattern: /^\d{3}-\d{4}$/,
                message: 'Please enter a valid Japanese postal code (e.g., 150-0002)'
            }
        }
    },
    AU: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            state: m.checkout_state(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Unit 4B',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Australian postal code (4 digits)'
            }
        }
    },
    NZ: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Unit 4B',
            city: 'Auckland',
            postalCode: '1010'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid New Zealand postal code (4 digits)'
            }
        }
    },
    DEFAULT: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: 'City',
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'City',
            postalCode: '10001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5,10}$/,
                message: 'Please enter a valid postal code'
            }
        }
    },
    PT: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Rua Principal 123',
            addressLine2: 'Apartamento 4B',
            city: 'Lisboa',
            postalCode: '1000-000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}-\d{3}$/,
                message: 'Please enter a valid Portuguese postal code (e.g., 1000-000)'
            }
        }
    },
    NL: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hoofdstraat 123',
            addressLine2: 'Appartement 4B',
            city: 'Amsterdam',
            postalCode: '1000 AA'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4} ?[A-Z]{2}$/i,
                message: 'Please enter a valid Dutch postal code (e.g., 1000 AA)'
            }
        }
    },
    BE: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hoofdstraat 123',
            addressLine2: 'Appartement 4B',
            city: 'Brussel',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Belgian postal code (4 digits)'
            }
        }
    },
    IE: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'county', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            county: m.checkout_county(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'Dublin',
            county: 'Dublin',
            postalCode: 'D01 A1AA'
        },
        validation: {
            postalCode: {
                pattern: /^[A-Z]\d{2} ?[A-Z]\d{1}[A-Z]{2}$/i,
                message: 'Please enter a valid Irish postal code (e.g., D01 A1AA)'
            }
        }
    },
    DK: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hovedgaden 123',
            addressLine2: 'Lejlighed 4B',
            city: 'København',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Danish postal code (4 digits)'
            }
        }
    },
    SE: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Huvudgatan 123',
            addressLine2: 'Lägenhet 4B',
            city: 'Stockholm',
            postalCode: '100 00'
        },
        validation: {
            postalCode: {
                pattern: /^\d{3} ?\d{2}$/,
                message: 'Please enter a valid Swedish postal code (e.g., 100 00)'
            }
        }
    },
    FI: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Pääkatu 123',
            addressLine2: 'Asunto 4B',
            city: 'Helsinki',
            postalCode: '00100'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Finnish postal code (5 digits)'
            }
        }
    },
    PL: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'ul. Główna 123',
            addressLine2: 'Mieszkanie 4B',
            city: 'Warszawa',
            postalCode: '00-001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{2}-\d{3}$/,
                message: 'Please enter a valid Polish postal code (e.g., 00-001)'
            }
        }
    },
    CZ: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hlavní 123',
            addressLine2: 'Byt 4B',
            city: 'Praha',
            postalCode: '100 00'
        },
        validation: {
            postalCode: {
                pattern: /^\d{3} ?\d{2}$/,
                message: 'Please enter a valid Czech postal code (e.g., 100 00)'
            }
        }
    },
    SK: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hlavná 123',
            addressLine2: 'Byt 4B',
            city: 'Bratislava',
            postalCode: '100 00'
        },
        validation: {
            postalCode: {
                pattern: /^\d{3} ?\d{2}$/,
                message: 'Please enter a valid Slovak postal code (e.g., 100 00)'
            }
        }
    },
    HU: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Fő utca 123',
            addressLine2: 'Lakás 4B',
            city: 'Budapest',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Hungarian postal code (4 digits)'
            }
        }
    },
    RO: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Strada Principală 123',
            addressLine2: 'Apartament 4B',
            city: 'București',
            postalCode: '100000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{6}$/,
                message: 'Please enter a valid Romanian postal code (6 digits)'
            }
        }
    },
    BG: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'ул. Главна 123',
            addressLine2: 'Апартамент 4B',
            city: 'София',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Bulgarian postal code (4 digits)'
            }
        }
    },
    HR: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Glavna ulica 123',
            addressLine2: 'Stan 4B',
            city: 'Zagreb',
            postalCode: '10000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Croatian postal code (5 digits)'
            }
        }
    },
    SI: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Glavna ulica 123',
            addressLine2: 'Stanovanje 4B',
            city: 'Ljubljana',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Slovenian postal code (4 digits)'
            }
        }
    },
    EE: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Põhja tänav 123',
            addressLine2: 'Korter 4B',
            city: 'Tallinn',
            postalCode: '10001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Estonian postal code (5 digits)'
            }
        }
    },
    LV: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Galvenā iela 123',
            addressLine2: 'Dzīvoklis 4B',
            city: 'Rīga',
            postalCode: 'LV-1001'
        },
        validation: {
            postalCode: {
                pattern: /^LV-\d{4}$/i,
                message: 'Please enter a valid Latvian postal code (e.g., LV-1001)'
            }
        }
    },
    LT: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Pagrindinė gatvė 123',
            addressLine2: 'Butas 4B',
            city: 'Vilnius',
            postalCode: '10001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Lithuanian postal code (5 digits)'
            }
        }
    },
    CY: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Κύρια Οδός 123',
            addressLine2: 'Διαμέρισμα 4B',
            city: 'Λευκωσία',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Cypriot postal code (4 digits)'
            }
        }
    },
    MT: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Triq il-Kbira 123',
            addressLine2: 'Appartament 4B',
            city: 'Valletta',
            postalCode: 'VLT 1000'
        },
        validation: {
            postalCode: {
                pattern: /^[A-Z]{3} ?\d{4}$/i,
                message: 'Please enter a valid Maltese postal code (e.g., VLT 1000)'
            }
        }
    },
    GR: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Κύρια Οδός 123',
            addressLine2: 'Διαμέρισμα 4B',
            city: 'Αθήνα',
            postalCode: '100 00'
        },
        validation: {
            postalCode: {
                pattern: /^\d{3} ?\d{2}$/,
                message: 'Please enter a valid Greek postal code (e.g., 100 00)'
            }
        }
    },
    AT: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hauptstraße 123',
            addressLine2: 'Wohnung 4B',
            city: 'Wien',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Austrian postal code (4 digits)'
            }
        }
    },
    LU: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Rue Principale 123',
            addressLine2: 'Appartement 4B',
            city: 'Luxembourg',
            postalCode: 'L-1000'
        },
        validation: {
            postalCode: {
                pattern: /^L-\d{4}$/i,
                message: 'Please enter a valid Luxembourg postal code (e.g., L-1000)'
            }
        }
    },
    IS: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Aðalgata 123',
            addressLine2: 'Íbúð 4B',
            city: 'Reykjavík',
            postalCode: '100'
        },
        validation: {
            postalCode: {
                pattern: /^\d{3}$/,
                message: 'Please enter a valid Icelandic postal code (3 digits)'
            }
        }
    },
    NO: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hovedgaten 123',
            addressLine2: 'Leilighet 4B',
            city: 'Oslo',
            postalCode: '0001'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Norwegian postal code (4 digits)'
            }
        }
    },
    CH: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hauptstraße 123',
            addressLine2: 'Wohnung 4B',
            city: 'Zürich',
            postalCode: '1000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Swiss postal code (4 digits)'
            }
        }
    },
    LI: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Hauptstraße 123',
            addressLine2: 'Wohnung 4B',
            city: 'Vaduz',
            postalCode: '9490'
        },
        validation: {
            postalCode: {
                pattern: /^\d{4}$/,
                message: 'Please enter a valid Liechtenstein postal code (4 digits)'
            }
        }
    },
    MC: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Rue Principale 123',
            addressLine2: 'Appartement 4B',
            city: 'Monaco',
            postalCode: '98000'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Monacan postal code (5 digits)'
            }
        }
    },
    AD: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Carrer Principal 123',
            addressLine2: 'Apartament 4B',
            city: 'Andorra la Vella',
            postalCode: 'AD100'
        },
        validation: {
            postalCode: {
                pattern: /^AD\d{3}$/i,
                message: 'Please enter a valid Andorran postal code (e.g., AD100)'
            }
        }
    },
    SM: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Via Principale 123',
            addressLine2: 'Appartamento 4B',
            city: 'San Marino',
            postalCode: '47890'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid San Marino postal code (5 digits)'
            }
        }
    },
    VA: {
        fields: ['firstName', 'lastName', 'addressLine1', 'addressLine2', 'city', 'postalCode'],
        labels: {
            addressLine1: m.checkout_address(),
            addressLine2: m.checkout_apartment(),
            city: m.checkout_city(),
            postalCode: m.checkout_zip()
        },
        placeholders: {
            addressLine1: 'Via Principale 123',
            addressLine2: 'Appartamento 4B',
            city: 'Vatican City',
            postalCode: '00120'
        },
        validation: {
            postalCode: {
                pattern: /^\d{5}$/,
                message: 'Please enter a valid Vatican City postal code (5 digits)'
            }
        }
    }
}; 