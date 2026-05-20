export const FORM_SCHEMA = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'email_date', label: 'Email Date', type: 'text' },
    { id: 'new_customer', label: 'New Customer?', type: 'checkbox' },
    {
        id: 'address',
        label: 'Address',
        type: 'textarea',
        enabledWhen: (form) => form.new_customer
    },
    { id: 'salesman', label: 'Salesman', type: 'select', data: 'salesman' },
    {
        id: 'city',
        label: 'City',
        type: 'select',
        data: 'cities',
        enabledWhen: (form, ctx) =>
            ctx.selectedSalesman?.region === 'AZ'
    },
    { id: 'contract_date', label: 'Contract Date', type: 'date' },
    { id: 'sources', label: 'Source', type: 'select', data: 'sources' },
    { id: 'job_name', label: 'Job Name', type: 'text' },
    { id: 'job_description', label: 'Job Description', type: 'textarea' },
    { id: 'price', label: 'Price', type: 'text', currency: true },
    { id: 'deposit', label: 'Deposit', type: 'text', currency: true },
    { id: 'depositType', label: 'Deposit Type', type: 'select', data: 'depositType' },
    { id: 'financed', label: 'Financed?', type: 'checkbox' },
    {
        id: 'amount_financed',
        label: 'Amount Financed',
        type: 'text',
        currency: true,
        enabledWhen: (form) => form.financed
    },
    {
        id: 'account_number',
        label: 'Account Number',
        type: 'text',
        enabledWhen: (form) => form.financed
    },
    {
        id: 'discounts',
        label: 'Discounts?',
        type: 'repeatable',
        toggle: 'discounts',
        includeInitial: true,
        fields: [
            { key: 'name', placeholder: 'Discount Name' },
            { key: 'price', placeholder: 'Discount Price', currency: true }
        ]
    },
    {
        id: 'progress_payments',
        label: 'Progress Payments?',
        type: 'repeatable',
        toggle: 'progress_payments',
        fields: [
            { key: 'name', placeholder: 'Payment Name' },
            { key: 'price', placeholder: 'Payment Price', currency: true }
        ]
    }
];

export const SALESMEN = {
    name: 'salesman',
    list: [
        { name: '-' },
        { name: 'Sal', value: 'SalS', region: 'CA', subregion: 'SC' },
        { name: 'Zac', value: 'Zac', region: 'CA', subregion: 'SC' },
        { name: 'Dom', value: 'DC', region: 'CA', subregion: 'SC' },
        { name: 'Dave', value: 'Dave', region: 'CA', subregion: 'NC' },
        { name: 'Nick B.', value: 'NB', region: 'CA', subregion: 'NC' },
        { name: 'Chris', value: 'CHP', region: 'AZ' },
        { name: 'Nick M.', value: 'NickM', region: 'AZ' }
    ]
};

export const AZ_CITIES = {
    name: 'AZ Cities',
    list: [
        { name: '-' },
        { name: 'N/A' },
        { name: 'Apache Junction', class: 'MP' },
        { name: 'Black Canyon City', class: 'NA' },
        { name: 'Benson', class: 'TU' },
        { name: 'Buckeye', class: 'MP' },
        { name: 'Casa Grande', class: 'MP' },
        { name: 'Cave Creek', class: 'MP' },
        { name: 'Chandler', class: 'MP' },
        { name: 'Chino Valley', class: 'NA' },
        { name: 'Cottonwood', class: 'MP' },
        { name: 'Dewey', class: 'NA' },
        { name: 'Flagstaff', class: 'NA' },
        { name: 'Gilbert', class: 'MP' },
        { name: 'Glendale', class: 'MP' },
        { name: 'Goodyear', class: 'MP' },
        { name: 'Kearny', class: 'MP' },
        { name: 'Mesa', class: 'MP' },
        { name: 'Marana', class: 'TU' },
        { name: 'Mayer', class: 'NA' },
        { name: 'New River', class: 'NA' },
        { name: 'Pheonix', class: 'MP' },
        { name: 'Preoria', class: 'MP' },
        { name: 'Prescott', class: 'NA' },
        { name: 'Queen Creek', class: 'MP' },
        { name: 'San Tan Valley', class: 'MP' },
        { name: 'Sedona', class: 'NA' },
        { name: 'Sun Lakes', class: 'MP' },
        { name: 'Superior', class: 'MP' },
        { name: 'Surprise', class: 'MP' },
        { name: 'Tempe', class: 'MP' },
        { name: 'Tucson', class: 'TU' },
        { name: 'Wickenburg', class: 'NA' },
        { name: 'Witmann', class: 'NA' },
    ]
};

export const SOURCES = {
    name: 'sources',
    list: [
        { name: '-' },
        { name: '(CI) Postcard', type: 'CI', abbreviation: 'PC' },
        { name: '(CI) Park Magazine', type: 'CI', abbreviation: 'PM' },
        { name: '(CI) Web Advertizements', type: 'CI', abbreviation: 'Web' },
        { name: '(CI) Referral', type: 'CI', abbreviation: 'Ref.' },
        { name: '(WC) Carlyn', type: 'WC' },
        { name: '(WC) Viki', type: 'WC' },
        { name: '(WC) Jose', type: 'WC' },
        { name: 'Go Back' },
        { name: 'Upsale' },
    ]
};

export const DEPOSIT_TYPES = {
    name: 'depositType',
    list: [
        { name: '-' },
        { name: 'CC' },
        { name: 'Check' },
        { name: 'Cash' },
        { name: 'Synchrony' }
    ]
};

export const SELECT_DATA = {
    salesman: SALESMEN,
    cities: AZ_CITIES,
    sources: SOURCES,
    depositType: DEPOSIT_TYPES
};