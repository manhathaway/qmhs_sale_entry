const getClass = (salesmanObj, cityObj) => {
    if (salesmanObj) {
        if (salesmanObj.region === 'CA') return salesmanObj.subregion;
        if (cityObj) return cityObj.class;
        return null;
    } else {
        return null;
    }
};

const getRegion = (salesmanObj) => {
    if (salesmanObj) {
        if (salesmanObj.region === 'AZ') return salesmanObj.region;
        return salesmanObj.subregion;
    } else {
        return null;
    }
}

const getStatus = (salesmanObj) => {
    if (salesmanObj) {
        if (salesmanObj.region === 'CA') return 'Admin Ready';
        return 'Ready';
    } else {
        return null;
    }
}

const getSource = (sourceObj) => {
    if (sourceObj) {
        if (sourceObj.type && sourceObj.abbreviation) {
            return `${sourceObj.type} - ${sourceObj.abbreviation}`;
        } else if (sourceObj.type) {
            return `${sourceObj.type} - ${sourceObj.name}`;
        } else {
            return sourceObj.name;
        }
    } else {
        return null;
    }
};

const buildAddressText = (data) => {
    let text = '';

    text += `${data.address_name}\n`;
    text += data.address;

    return text;
};

const buildEstimateText = (data) => {
    let text = '';

    text += `${data.job_description}\n`;

    if (data.financed) {
        text += '\nSYNCHRONY\n';
        text += `   - Amount Financed: ${data.amount_financed}\n`;
        text += `   - Account Number: ${data.account_number}\n`;
    }

    if (data.progress_payments.length) {
        text += '\nPROGRESS PAYMENTS:\n';
        data.progress_payments.forEach(payment => {
            text += `   - ${payment.name}: ${payment.price}\n`;
        });
    }

    if (data.discounts.length) {
        text += '\nDISCOUNTS:\n';
        data.discounts.forEach(discount => {
            text += `   - ${discount.name}: ${discount.price}\n`;
        });
    }

    text += `\nPrice: ${data.price}`;
    text += `\nDeposit: ${data.deposit}`;
    if (data.depositType) {
        text += ` - ${data.depositType}`;
    }
    text += `\nBalance: ${data.balance}`

    return text;
};

const buildNoteText = (data) => {
    let text = '';

    text += `${data.contract_date} - ${data.price} - ${data.salesman}:\n`;
    text += `Job entered, folder made.\n`;
    if (data.email_date !== '[MISSING]') {
        text += `Sales email received: `;
        if ((/^(?:1[0-2]|[1-9]):[0-5]\d(?:AM|PM)$/i).test(data.email_date.replace(' ', ''))) {

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
            const today = new Date();
            const formattedDate = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;

            text += `${formattedDate}, ${data.email_date}`;
        } else {
            text += data.email_date;
        }
    } else {
        text += 'Sales email not received/entered beforehand.';
    }

    return text;
};

export {
    getClass,
    getRegion,
    getStatus,
    getSource,
    buildAddressText,
    buildEstimateText,
    buildNoteText,
};