import { buildInitialState, formatCurrency } from './formHelpers';
import { FORM_SCHEMA, SALESMEN, SOURCES, DEPOSIT_TYPES } from './data';

const TRANSFERABLE_STATUSES = ['Sale Won', 'Cancelled'];
const ZERO_CURRENCY = '$0';

const normalizeDate = (value) => {
    if (!value) return '';

    if (value.includes('-')) {
        return value;
    }

    if (value.includes('/')) {
        const [month, day, year] = value.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return '';
};

const getStatusName = (lead) => {
    return lead.StatusMetaData && typeof lead.StatusMetaData === 'object'
        ? lead.StatusMetaData.Name
        : lead.StatusMetaData;
};

const getStatusShortName = (lead) => {
    const statusName = getStatusName(lead) || '';

    if (statusName.includes('Sale Won')) return 'Sale Won';
    if (statusName.includes('Sale Lost')) return 'Sale Lost';
    if (statusName.includes('Cancelled')) return 'Cancelled';
    if (statusName.includes('No-Pitch')) return 'No-Pitch';
    if (statusName.includes('Left Bid')) return 'Left Bid';
    if (statusName.includes('Porched') || statusName.includes('No Show')) return 'Porched/No Show';
    if (statusName.includes('Appointment Confirmed')) return 'Appointment Confirmed';

    return statusName;
};

const getLeadType = (lead) => lead['Lead Type'] || '';
const getLeadSource = (lead) => lead['Lead Source'] || '';
const getSalesRep = (lead) => lead['Sales Rep Assigned'] || '';
const getContractDate = (lead) => lead['Sale Date'] || lead['Appointment Date'] || '';

const mapSalesman = (salesRep) => {
    const rep = salesRep.toLowerCase();

    const match = SALESMEN.list.find(option => {
        const name = (option.name || '').toLowerCase();
        const value = (option.value || '').toLowerCase();
        return name && (rep.includes(name.replace(/[().]/g, '').trim()) || rep.includes(name.split(' ')[0])) || (value && rep.includes(value));
    });

    if (match?.value) return match.value;

    if (rep.includes('sal')) return 'SalS';
    if (rep.includes('zac')) return 'Zac';
    if (rep.includes('dom')) return rep.includes('az') ? 'DC' : 'Dom';
    if (rep.includes('dave')) return 'Dave';
    if (rep.includes('nick m')) return 'NickM';
    if (rep.includes('nick') && rep.includes('b')) return 'NB';
    if (rep.includes('chris')) return 'CHP';

    return '';
};

const mapDepositType = (depositType) => {
    const normalized = String(depositType || '').trim().toLowerCase();

    const match = DEPOSIT_TYPES.list.find(option => {
        const optionValue = String(option.value || '').trim().toLowerCase();
        const optionName = String(option.name || '').trim().toLowerCase();

        return optionValue === normalized || optionName === normalized;
    });

    if (match?.value) return match.value;

    if (normalized.includes('sync')) return 'Synchrony';
    if (normalized.includes('credit') || normalized === 'cc') return 'CC';
    if (normalized.includes('check')) return 'Check';
    if (normalized.includes('cash')) return 'Cash';

    return '';
};

const extractDepositType = (lead) => {
    const candidateValues = [
        lead['Deposit Type'],
        lead['Depost Type'],
        lead.DepositType,
        lead.depositType,
        lead.deposit_type,
    ];

    for (const candidate of candidateValues) {
        if (!candidate) continue;

        if (typeof candidate === 'string') {
            return candidate;
        }

        if (typeof candidate === 'object') {
            return candidate.Name || candidate.Value || candidate.value || candidate.name || '';
        }
    }

    return '';
};

const parseDepositAmount = (depositAmount) => {
    if (depositAmount === null || depositAmount === undefined || depositAmount === '') {
        return ZERO_CURRENCY;
    }

    const numericValue = Number(String(depositAmount).replace(/[^0-9.-]+/g, ''));

    if (!Number.isFinite(numericValue) || numericValue === 0) {
        return ZERO_CURRENCY;
    }

    return formatCurrency(numericValue);
};

const mapSource = (lead) => {
    const leadType = getLeadType(lead);
    const leadSource = getLeadSource(lead);
    const csr = (lead['Customer Service Representative'] || '').trim();

    if (leadType === 'Upsale') return 'Upsale';
    if (leadType === 'Go-Back' || leadType === 'Go Back') return 'Go Back';

    if (leadType === 'Call In') {
        const callInMatch = SOURCES.list.find(option => option.type === 'CI' && option.name === leadSource);
        return callInMatch?.value || '';
    }

    if (leadType === 'Quality Check' || leadType === 'Warranty Check') {
        const wcMatch = SOURCES.list.find(option => option.type === 'WC' && option.name === csr);
        if (wcMatch?.value) return wcMatch.value;
    }

    const directMatch = SOURCES.list.find(option => option.name === leadSource || option.value === leadSource);
    return directMatch?.value || '';
};

export const canTransferLeadToSaleEntry = (lead) => {
    const statusName = getStatusShortName(lead);
    if (!statusName) return false;
    return TRANSFERABLE_STATUSES.includes(statusName);
};

export const buildSaleEntryPrefill = (lead) => {
    const base = buildInitialState(FORM_SCHEMA);

    const saleAmount = lead['Sale Amount'] || '';
    const depositAmount = lead['Deposit Amount'] || '';
    const financeInstitution = lead['Finance Institution'] || '';
    const depositType = extractDepositType(lead);
    const normalizedDepositAmount = parseDepositAmount(depositAmount);
    const hasDeposit = String(normalizedDepositAmount) !== ZERO_CURRENCY;

    const prefill = {
        ...base,
        name: lead.contactName || '',
        salesman: mapSalesman(getSalesRep(lead)),
        contract_date: normalizeDate(getContractDate(lead)),
        price: saleAmount ? formatCurrency(saleAmount) : '',
        deposit: normalizedDepositAmount,
        deposit_type: hasDeposit ? mapDepositType(depositType) : '',
        financed: financeInstitution === 'Synchrony',
        source: mapSource(lead),
    };

    return prefill;
};

export {
    getStatusName,
    getStatusShortName,
};
