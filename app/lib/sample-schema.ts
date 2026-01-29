import type { FormSchema, SelectOption } from './types/form-schema'

export const sampleSchema: FormSchema = {
  if: {
    required: ['purchase_type'],
    properties: {
      purchase_type: {
        const: 'lease',
      },
    },
  },
  else: {
    required: ['proof_of_ownership_url'],
    properties: {
      proof_of_ownership_url: {
        type: 'string',
      },
    },
  },
  then: {
    required: ['lease_agreement_url', 'lessor_company_name'],
    properties: {
      lease_agreement_url: {
        type: 'string',
      },
      lessor_company_name: {
        type: 'string',
      },
    },
  },
  type: 'object',
  required: [
    'first_name',
    'last_name',
    'email',
    'phone_number',
    'gender',
    'date_of_birth',
    'address',
    'title',
    'identification_url',
    'vehicle_make',
    'vehicle_model',
    'vehicle_category',
    'vehicle_color',
    'registration_number',
    'engine_number',
    'chassis_number',
    'year_of_manufacture',
  ],
  properties: {
    nin: {
      type: 'string',
      pattern: '^[0-9]{11}$',
      'x-label': 'NIN',
      'x-order': 18,
      'x-source': {
        type: 'number',
      },
      errorMessage: {
        pattern: 'NIN must be exactly 11 digits',
      },
      'x-description': 'Enter your 11-digit NIN',
      'x-required_if': {
        field: 'has_nin',
        value: true,
        operator: 'eq',
      },
    },
    email: {
      type: 'string',
      'x-label': 'Email Address',
      'x-order': 2,
      'x-source': {
        type: 'text',
      },
      minLength: 5,
      'x-description': 'your@email.com',
    },
    title: {
      type: 'string',
      'x-label': 'Title',
      'x-order': 7,
      'x-source': {
        data: [
          { label: 'Mr', value: 'mr' },
          { label: 'Mrs', value: 'mrs' },
          { label: 'Miss', value: 'miss' },
          { label: 'Dr', value: 'dr' },
          { label: 'Engr', value: 'engr' },
        ],
        type: 'array',
      },
      minLength: 2,
      'x-description': 'Select title',
    },
    gender: {
      enum: ['Male', 'Female'],
      type: 'string',
      'x-label': 'Gender',
      'x-order': 4,
      'x-source': {
        data: [
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
        ],
        type: 'array',
      },
      'x-description': 'Select gender',
    },
    address: {
      type: 'string',
      'x-label': 'Residential Address',
      'x-order': 6,
      'x-source': {
        type: 'text',
      },
      minLength: 5,
      'x-description': 'Enter full address',
    },
    lease_agreement_url: {
      type: 'string',
      'x-label': 'Lease Agreement',
      'x-order': 19,
      'x-source': {
        data: {
          accept: 'image/*,application/pdf',
          fileType: ['image', 'pdf'],
        },
        type: 'file',
      },
      'x-description': 'Upload lease agreement document',
      'x-required_if': {
        field: 'purchase_type',
        value: 'lease',
        operator: 'eq',
      },
    },
    lessor_company_name: {
      type: 'string',
      'x-label': 'Leasing Company Name',
      'x-order': 20,
      'x-source': {
        type: 'text',
      },
      minLength: 2,
      'x-description': 'Enter leasing company name',
      'x-required_if': {
        field: 'purchase_type',
        value: 'lease',
        operator: 'eq',
      },
    },
    last_name: {
      type: 'string',
      'x-label': 'Last Name',
      'x-order': 1,
      'x-source': {
        type: 'text',
      },
      minLength: 2,
      'x-description': 'Enter last name',
    },
    first_name: {
      type: 'string',
      'x-label': 'First Name',
      'x-order': 0,
      'x-source': {
        type: 'text',
      },
      minLength: 2,
      'x-description': 'Enter first name',
    },
    proof_of_ownership_url: {
      type: 'string',
      'x-label': 'Proof of Ownership',
      'x-order': 21,
      'x-source': {
        data: {
          accept: 'image/*,application/pdf',
          fileType: ['image', 'pdf'],
        },
        type: 'file',
      },
      'x-description': 'Upload vehicle ownership document',
      'x-required_if': {
        field: 'purchase_type',
        value: 'owned',
        operator: 'eq',
      },
    },
    phone_number: {
      type: 'string',
      'x-label': 'Phone Number',
      'x-order': 3,
      'x-source': {
        type: 'tel',
      },
      minLength: 10,
      'x-description': '080XXXXXXXX',
    },
    vehicle_make: {
      type: 'string',
      'x-label': 'Vehicle Make',
      'x-order': 10,
      'x-source': {
        data: [
          { label: 'Toyota', value: 'toyota' },
          { label: 'Honda', value: 'honda' },
          { label: 'Mercedes-Benz', value: 'mercedes' },
          { label: 'BMW', value: 'bmw' },
          { label: 'Lexus', value: 'lexus' },
          { label: 'Nissan', value: 'nissan' },
          { label: 'Hyundai', value: 'hyundai' },
          { label: 'Kia', value: 'kia' },
        ],
        type: 'array',
      },
      minLength: 2,
      'x-description': 'Select vehicle make',
    },
    date_of_birth: {
      type: 'string',
      'x-label': 'Date of Birth',
      'x-order': 5,
      'x-source': {
        data: {
          minAge: 18,
        },
        type: 'date',
      },
      'x-description': 'DD/MM/YYYY',
    },
    engine_number: {
      type: 'string',
      'x-label': 'Engine Number',
      'x-order': 14,
      'x-source': {
        type: 'text',
      },
      minLength: 10,
      'x-description': 'Enter engine number',
    },
    vehicle_color: {
      type: 'string',
      'x-label': 'Vehicle Color',
      'x-order': 9,
      'x-source': {
        data: [
          { label: 'Black', value: 'black' },
          { label: 'White', value: 'white' },
          { label: 'Silver', value: 'silver' },
          { label: 'Grey', value: 'grey' },
          { label: 'Blue', value: 'blue' },
          { label: 'Red', value: 'red' },
          { label: 'Green', value: 'green' },
          { label: 'Brown', value: 'brown' },
        ],
        type: 'array',
      },
      minLength: 3,
      'x-description': 'Select vehicle color',
    },
    vehicle_model: {
      type: 'string',
      'x-label': 'Vehicle Model',
      'x-order': 11,
      'x-source': {
        data: {
          dependsOn: 'vehicle_make',
          options: {
            toyota: [
              { label: 'Camry', value: 'camry' },
              { label: 'Corolla', value: 'corolla' },
              { label: 'RAV4', value: 'rav4' },
              { label: 'Highlander', value: 'highlander' },
            ],
            honda: [
              { label: 'Accord', value: 'accord' },
              { label: 'Civic', value: 'civic' },
              { label: 'CR-V', value: 'crv' },
              { label: 'Pilot', value: 'pilot' },
            ],
            mercedes: [
              { label: 'C-Class', value: 'c_class' },
              { label: 'E-Class', value: 'e_class' },
              { label: 'GLE', value: 'gle' },
              { label: 'GLC', value: 'glc' },
            ],
            bmw: [
              { label: '3 Series', value: '3_series' },
              { label: '5 Series', value: '5_series' },
              { label: 'X5', value: 'x5' },
              { label: 'X3', value: 'x3' },
            ],
            lexus: [
              { label: 'ES', value: 'es' },
              { label: 'RX', value: 'rx' },
              { label: 'NX', value: 'nx' },
              { label: 'GX', value: 'gx' },
            ],
            nissan: [
              { label: 'Altima', value: 'altima' },
              { label: 'Sentra', value: 'sentra' },
              { label: 'Rogue', value: 'rogue' },
              { label: 'Pathfinder', value: 'pathfinder' },
            ],
            hyundai: [
              { label: 'Elantra', value: 'elantra' },
              { label: 'Sonata', value: 'sonata' },
              { label: 'Tucson', value: 'tucson' },
              { label: 'Santa Fe', value: 'santa_fe' },
            ],
            kia: [
              { label: 'Optima', value: 'optima' },
              { label: 'Forte', value: 'forte' },
              { label: 'Sportage', value: 'sportage' },
              { label: 'Sorento', value: 'sorento' },
            ],
          },
        },
        type: 'array',
      },
      'x-description': 'Select vehicle model',
    },
    chassis_number: {
      type: 'string',
      'x-label': 'Chassis Number',
      'x-order': 15,
      'x-source': {
        type: 'text',
      },
      minLength: 10,
      'x-description': 'Enter chassis number',
    },
    has_nin: {
      type: 'boolean',
      'x-label': 'Do you have a NIN?',
      'x-order': 17,
      'x-source': {
        data: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
        type: 'array',
      },
      'x-description': 'Select an option',
    },
    vehicle_category: {
      type: 'string',
      'x-label': 'Vehicle Category',
      'x-order': 8,
      'x-source': {
        data: [
          { label: 'Private Sedan', value: 'private_sedan' },
          { label: 'Private SUV', value: 'private_suv' },
          { label: 'Commercial Bus', value: 'commercial_bus' },
          { label: 'Commercial Van', value: 'commercial_van' },
          { label: 'Motorcycle', value: 'motorcycle' },
          { label: 'Truck', value: 'truck' },
        ],
        type: 'array',
      },
      minLength: 3,
      'x-description': 'Select vehicle category',
    },
    identification_url: {
      type: 'string',
      format: 'url',
      'x-label': 'Identification Document',
      'x-order': 16,
      'x-source': {
        data: {
          accept: 'image/*,application/pdf',
          fileType: ['image', 'pdf'],
        },
        type: 'file',
      },
      'x-description': "Upload valid ID (Driver's License, Passport, etc.)",
    },
    purchase_type: {
      type: 'string',
      'x-label': 'Vehicle Purchase Type',
      'x-order': 22,
      'x-source': {
        data: [
          { label: 'Owned', value: 'owned' },
          { label: 'Leased', value: 'lease' },
        ],
        type: 'array',
      },
      'x-description': 'How did you acquire the vehicle?',
    },
    registration_number: {
      type: 'string',
      'x-label': 'Registration Number',
      'x-order': 13,
      'x-source': {
        type: 'text',
      },
      minLength: 2,
      'x-description': 'Enter vehicle registration number',
    },
    year_of_manufacture: {
      type: 'string',
      'x-label': 'Year Of Manufacture',
      'x-order': 12,
      'x-source': {
        data: [
          { label: '2024', value: '2024' },
          { label: '2023', value: '2023' },
          { label: '2022', value: '2022' },
          { label: '2021', value: '2021' },
          { label: '2020', value: '2020' },
          { label: '2019', value: '2019' },
          { label: '2018', value: '2018' },
          { label: '2017', value: '2017' },
          { label: '2016', value: '2016' },
          { label: '2015', value: '2015' },
          { label: '2014', value: '2014' },
          { label: '2013', value: '2013' },
          { label: '2012', value: '2012' },
          { label: '2011', value: '2011' },
          { label: '2010', value: '2010' },
        ],
        type: 'array',
      },
      minLength: 4,
      'x-description': 'Select year',
    },
  },
}

/**
 * Map of dependent options for the form builder
 * Note: For this schema, dependent options are embedded directly in the schema
 * This map can be used for additional external dependent options if needed
 */
export const dependentOptionsMap: Record<
  string,
  Record<string, SelectOption[]>
> = {}
