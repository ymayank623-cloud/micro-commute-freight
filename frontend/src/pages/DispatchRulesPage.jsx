import React from 'react';
import DispatchPolicyManager from '../components/DispatchPolicyManager';
import { useNavigate } from 'react-router-dom';

function DispatchRulesPage() {
    const navigate = useNavigate();

    return (
        <div className="dispatch-rules-page-container py-3">
            <DispatchPolicyManager onClose={() => navigate('/dashboard')} />
        </div>
    );
}

export default DispatchRulesPage;
