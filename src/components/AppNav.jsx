import { useState } from 'react';
import Form from './Form.jsx';
import LeadsBoard from './LeadsBoard.jsx';
import Reports from './Reports.jsx';
import styles from './AppNav.module.css';

export default function AppNav() {
    const [activeTab, setActiveTab] = useState('leadsBoard');
    const [leadPrefill, setLeadPrefill] = useState(null);

    const handleLeadSelect = (prefillData) => {
        setLeadPrefill(prefillData);
        setActiveTab('saleEntry');
    };

    const handlePrefillConsumed = () => {
        setLeadPrefill(null);
    };

    return (
        <div className={styles.appContainer}>
            <div className={styles.tabBar}>
                <button
                    className={`${styles.tab} ${activeTab === 'saleEntry' ? styles.active : ''}`}
                    onClick={() => setActiveTab('saleEntry')}
                >
                    Sale Entry
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'leadsBoard' ? styles.active : ''}`}
                    onClick={() => setActiveTab('leadsBoard')}
                >
                    Leads Board
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'reports' ? styles.active : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    Reports
                </button>
            </div>

            <div className={styles.tabContent}>
                <div className={`${styles.tabPanel} ${activeTab === 'saleEntry' ? styles.visible : ''}`}>
                    <Form prefillData={leadPrefill} onPrefillConsumed={handlePrefillConsumed} />
                </div>
                <div className={`${styles.tabPanel} ${activeTab === 'leadsBoard' ? styles.visible : ''}`}>
                    <LeadsBoard onLeadSelect={handleLeadSelect} />
                </div>
                <div className={`${styles.tabPanel} ${activeTab === 'reports' ? styles.visible : ''}`}>
                    <Reports />
                </div>
            </div>
        </div>
    );
}
