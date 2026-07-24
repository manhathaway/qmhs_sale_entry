import { useState } from 'react';
import { getEventPipelinesForDate } from '../services/lacrmApi';
import styles from './ApiTester.module.css';

export default function ApiTester() {
    const pipelineId = '3533819624848357990560426858357'; // Fixed pipeline ID
    const [startDate, setStartDate] = useState('2026-07-24');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFetch = async () => {
        setLoading(true);
        setError(null);
        setItems([]);

        try {
            // Calculate end date as the day after start date
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const endDate = end.toISOString().split('T')[0];

            const result = await getEventPipelinesForDate(pipelineId, startDate, endDate);
            setItems(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2>Daily Leads</h2>

            <div className={styles.form}>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <button onClick={handleFetch} disabled={loading}>
                    {loading ? 'Loading...' : 'Fetch Pipelines'}
                </button>
            </div>

            {error && <div className={styles.error}>Error: {error}</div>}

            {items.length > 0 && (
                <div className={styles.results}>
                    <h3>Results ({items.length} pipelines)</h3>
                    <div className={styles.itemsList}>
                        {items.sort((a, b) => {
                            const getStatusOrder = (item) => {
                                const status = item.StatusMetaData && typeof item.StatusMetaData === 'object' ? item.StatusMetaData.Name : item.StatusMetaData;
                                if (status && status.includes('Sale Won')) return 1;
                                if (status && status.includes('Cancelled')) return 2;
                                if (status && status.includes('Sale Lost')) return 3;
                                if (status && status.includes('Left Bid')) return 4;
                                if (status && status.includes('No-Pitch')) return 5;
                                if (status && status.includes('Porched')) return 6;
                                if (status && status.includes('No Show')) return 7;
                                if (status === 'Appointment Confirmed') return 8;
                                return 9;
                            };
                            return getStatusOrder(a) - getStatusOrder(b);
                        }).map((item, idx) => {
                            const statusName = item.StatusMetaData && typeof item.StatusMetaData === 'object' ? item.StatusMetaData.Name : item.StatusMetaData;
                            let statusClass = '';
                            if (statusName && statusName.includes('Sale Won')) statusClass = styles.saleWon;
                            else if (statusName && statusName.includes('Cancelled')) statusClass = styles.saleLost;
                            else if (statusName && statusName.includes('Sale Lost')) statusClass = styles.saleLost;
                            else if (statusName && (statusName.includes('No-Pitch') || statusName.includes('Left Bid') || statusName.includes('Porched') || statusName.includes('No Show'))) statusClass = styles.noOptionOrLeftBid;
                            else if (statusName === 'Appointment Confirmed') statusClass = styles.appointmentConfirmed;

                            return (
                                <div key={idx} className={`${styles.item} ${statusClass}`}>
                                    {item.StatusMetaData && <div><strong>Status:</strong> {typeof item.StatusMetaData === 'object' ? item.StatusMetaData.Name : item.StatusMetaData}</div>}
                                    {item['Appointment Date'] && <div><strong>Appointment Date:</strong> {item['Appointment Date']}</div>}
                                    {item.contactName && <div><strong>Contact:</strong> {item.contactName}</div>}
                                    {item.ContactMetaData && typeof item.ContactMetaData === 'object' && item.ContactMetaData.Name && <div><strong>Contact Name:</strong> {item.ContactMetaData.Name}</div>}
                                    {item.contactId && <div><strong>Contact ID:</strong> {item.contactId}</div>}
                                    {item['Sale Amount'] && <div><strong>Sale Amount:</strong> {item['Sale Amount']}</div>}
                                    {item['Sales Rep Assigned'] && <div><strong>Sales Rep:</strong> {item['Sales Rep Assigned']}</div>}
                                    {item['Lead Type'] && <div><strong>Lead Type:</strong> {item['Lead Type']}</div>}
                                    {item['Lead Source'] && <div><strong>Lead Source:</strong> {item['Lead Source']}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {items.length === 0 && !loading && !error && (
                <div className={styles.empty}>No pipelines found</div>
            )}
        </div>
    );
}
