import { useState, useEffect } from 'react';
import { getEventPipelinesForDate } from '../services/lacrmApi';
import { buildSaleEntryPrefill, canTransferLeadToSaleEntry, getStatusShortName } from '../leadTransfer';
import styles from './LeadsBoard.module.css';

export default function LeadsBoard({ onLeadSelect }) {
    const pipelineId = '3533819624848357990560426858357'; // Fixed pipeline ID
    const [startDate, setStartDate] = useState('2026-07-24');
    const [endDate, setEndDate] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedReps, setSelectedReps] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Update progress bars in real-time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch data automatically every 30 seconds and when date changes
    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const start = new Date(startDate);
            let end = new Date(start);

            // Use custom end date if provided, otherwise default to next day
            if (endDate) {
                end = new Date(endDate);
            } else {
                end.setDate(end.getDate() + 1);
            }

            const endDateStr = end.toISOString().split('T')[0];
            const result = await getEventPipelinesForDate(pipelineId, startDate, endDateStr);
            setItems(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when date changes
    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Set up auto-refresh interval based on items (only for today's date while 'Appointment Confirmed' items exist)
    useEffect(() => {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Check if there are any 'Appointment Confirmed' items
        const hasAppointmentConfirmed = items.some(item => {
            const statusName = item.StatusMetaData && typeof item.StatusMetaData === 'object'
                ? item.StatusMetaData.Name
                : item.StatusMetaData;

            return statusName === 'Appointment Confirmed';
        });

        // Set up interval for auto-refresh (30 seconds) only if viewing today AND there are 'Appointment Confirmed' items
        let interval = null;
        if (startDate === today && hasAppointmentConfirmed && !endDate) {
            interval = setInterval(fetchData, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [startDate, endDate, items]);

    // Get unique statuses and sales reps for filter options
    const uniqueStatuses = [...new Set(items.map(item => {
        return getStatusShortName(item);
    }).filter(Boolean))].sort();

    const uniqueReps = [...new Set(items.map(item => item['Sales Rep Assigned']).filter(Boolean))].sort();

    // Filter items based on selected filters
    const filteredItems = items.filter(item => {
        const statusName = getStatusShortName(item);
        const rep = item['Sales Rep Assigned'];

        const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(statusName);
        const repMatch = selectedReps.length === 0 || selectedReps.includes(rep);

        return statusMatch && repMatch;
    });

    const toggleStatus = (status) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const toggleRep = (rep) => {
        setSelectedReps(prev =>
            prev.includes(rep)
                ? prev.filter(r => r !== rep)
                : [...prev, rep]
        );
    };

    const handleLeadClick = (lead) => {
        if (!canTransferLeadToSaleEntry(lead) || !onLeadSelect) return;
        onLeadSelect(buildSaleEntryPrefill(lead));
    };

    const handleContactClick = (lead, event) => {
        event.stopPropagation();

        const contactId = lead.contactId || lead.ContactId;
        if (!contactId) return;

        window.open(`https://account.lessannoyingcrm.com/app/View_Contact?ContactId=${contactId}`, '_blank', 'noopener,noreferrer');
    };

    const handleTransferClick = (lead, event) => {
        event.stopPropagation();

        if (!canTransferLeadToSaleEntry(lead) || !onLeadSelect) return;
        onLeadSelect(buildSaleEntryPrefill(lead));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End Date (Optional)"
                        title="Optional - leave blank for single day"
                    />
                    <button
                        className={styles.filterButton}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
                <div className={styles.headerRight}>
                    {loading && <div className={styles.spinner}></div>}
                </div>
            </div>

            {showFilters && (
                <div className={styles.filterPanel}>
                    <div className={styles.filterSection}>
                        <div className={styles.filterTitle}>Statuses</div>
                        <div className={styles.filterOptions}>
                            {uniqueStatuses.map(status => (
                                <label key={status} className={styles.filterCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => toggleStatus(status)}
                                    />
                                    {status}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <div className={styles.filterTitle}>Sales Reps</div>
                        <div className={styles.filterOptions}>
                            {uniqueReps.map(rep => (
                                <label key={rep} className={styles.filterCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedReps.includes(rep)}
                                        onChange={() => toggleRep(rep)}
                                    />
                                    {rep}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {error && <div className={styles.error}>Error: {error}</div>}

            {filteredItems.length > 0 && (
                <div className={styles.results}>
                    <h3>Results ({filteredItems.length} of {items.length} pipelines)</h3>
                    <div className={styles.itemsList}>
                        {filteredItems.sort((a, b) => {
                            // Sort by appointment date first
                            const dateA = a['Appointment Date'] ? new Date(a['Appointment Date']).getTime() : Infinity;
                            const dateB = b['Appointment Date'] ? new Date(b['Appointment Date']).getTime() : Infinity;
                            if (dateA !== dateB) {
                                return dateA - dateB;
                            }

                            // Then by event start time
                            const startA = a.eventStartTime ? new Date(a.eventStartTime).getTime() : Infinity;
                            const startB = b.eventStartTime ? new Date(b.eventStartTime).getTime() : Infinity;
                            if (startA !== startB) {
                                return startA - startB;
                            }

                            // Finally by event end time
                            const endA = a.eventEndTime ? new Date(a.eventEndTime).getTime() : Infinity;
                            const endB = b.eventEndTime ? new Date(b.eventEndTime).getTime() : Infinity;
                            return endA - endB;
                        }).map((item, idx) => {
                            const statusName = getStatusShortName(item);
                            let statusClass = '';
                            if (statusName === 'Sale Won') statusClass = styles.saleWon;
                            else if (statusName === 'Sale Lost' || statusName === 'Cancelled') statusClass = styles.saleLost;
                            else if (statusName === 'No-Pitch' || statusName === 'Left Bid' || statusName === 'Porched/No Show') statusClass = styles.noOptionOrLeftBid;
                            else if (statusName === 'Appointment Confirmed') statusClass = styles.appointmentConfirmed;

                            const canTransfer = canTransferLeadToSaleEntry(item);

                            // Calculate progress value for progress element (updates every second)
                            let progressValue = 100; // Default to 100 (solid) for non-Appointment Confirmed

                            // Only calculate time-based progress for "Appointment Confirmed" status
                            if (statusName === 'Appointment Confirmed' && item.eventStartTime && item.eventEndTime) {
                                const start = new Date(item.eventStartTime).getTime();
                                const end = new Date(item.eventEndTime).getTime();
                                const now = new Date().getTime();

                                if (now >= end) {
                                    progressValue = 100;
                                } else if (now >= start) {
                                    progressValue = Math.round(((now - start) / (end - start)) * 100);
                                } else {
                                    progressValue = 0;
                                }
                            }
                            // Use updateTrigger to ensure re-render every second for live updates
                            void updateTrigger;

                            return (
                                <div
                                    key={idx}
                                    className={`${styles.item} ${statusClass} ${canTransfer ? styles.clickableItem : ''}`}
                                    onClick={() => handleLeadClick(item)}
                                    onKeyDown={(e) => {
                                        if (!canTransfer) return;
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleLeadClick(item);
                                        }
                                    }}
                                    role={canTransfer ? 'button' : undefined}
                                    tabIndex={canTransfer ? 0 : undefined}
                                    title={canTransfer ? 'Click to load into Sale Entry' : undefined}
                                >
                                    <progress className={styles.progress} value={progressValue} max="100"></progress>

                                    <div className={styles.itemContent}>
                                        {/* Left side - Contact and Sales Rep */}
                                        <div className={styles.leftColumn}>
                                            {item.contactName && <div className={styles.contactName}>{item.contactName}</div>}
                                            {item['Sales Rep Assigned'] && <div className={styles.salesRep}>{item['Sales Rep Assigned']}</div>}
                                        </div>

                                        {/* Right side - Lead Type and Lead Source */}
                                        <div className={styles.rightColumn}>
                                            {item['Lead Type'] && <div className={styles.leadType}>{item['Lead Type']}</div>}
                                            {item['Lead Source'] && <div className={styles.leadSource}>{item['Lead Source']}</div>}
                                        </div>
                                    </div>

                                    <div className={styles.itemFooter}>
                                        <div className={styles.footerLeft}>
                                            {item.StatusMetaData && <div className={styles.status}>{statusName}</div>}
                                        </div>

                                        <div className={styles.footerRight}>
                                            {item['Appointment Date'] && <div className={styles.date}>{item['Appointment Date']}</div>}
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <button
                                            type="button"
                                            className={`${styles.actionButtonSecondary} ${statusClass}`}
                                            onClick={(event) => handleContactClick(item, event)}
                                            disabled={!item.contactId && !item.ContactId}
                                            title={item.contactId || item.ContactId ? 'Open contact page' : 'Missing contact id'}
                                        >
                                            View Contact
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.actionButtonPrimary} ${statusClass}`}
                                            onClick={(event) => handleTransferClick(item, event)}
                                            disabled={!canTransfer || !onLeadSelect}
                                            title={canTransfer ? 'Copy data to Sale Entry' : 'Only Sale Won and Cancelled pipelines can transfer'}
                                        >
                                            Copy Data
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {items.length === 0 && !loading && !error && (
                <div className={styles.empty}>No pipelines found</div>
            )}

            {filteredItems.length === 0 && items.length > 0 && !loading && !error && (
                <div className={styles.empty}>No pipelines match the selected filters</div>
            )}
        </div>
    );
}
