import { useState } from 'react';
import Header from './Header.jsx';
import Form from './Form.jsx';
import LeadsBoard from './LeadsBoard.jsx';
import styles from './AppNav.module.css';

export default function AppNav() {
    const [activeTab, setActiveTab] = useState('leadsBoard');

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
            </div>

            <div className={styles.tabContent}>
                <div className={`${styles.tabPanel} ${activeTab === 'saleEntry' ? styles.visible : ''}`}>
                    <Form />
                </div>
                <div className={`${styles.tabPanel} ${activeTab === 'leadsBoard' ? styles.visible : ''}`}>
                    <LeadsBoard />
                </div>
            </div>
        </div>
    );
}
