import React from 'react';

const VaultSkeleton: React.FC = () => {
  return (
    <div className="vault-view-bubble" style={{ minHeight: '75vh' }}>
      <div style={{ padding: '24px 0', transform: 'translateX(-6px)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '48px' }}>
        {/* Custom compact 6-line layout */}
        {/* 1) One big thick line on top */}
        <div className="skeleton-item" style={{ width: '92%', height: '28px', borderRadius: '8px', margin: '0 auto' }}></div>

        {/* 2-4) Three small rectangles on the right side (stacked) */}
        <div style={{ width: '92%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '48px' }}>
          <div className="skeleton-item" style={{ width: '46%', height: '12px', borderRadius: '6px' }}></div>
          <div className="skeleton-item" style={{ width: '40%', height: '12px', borderRadius: '6px' }}></div>
          <div className="skeleton-item" style={{ width: '34%', height: '12px', borderRadius: '6px' }}></div>
        </div>

        {/* 5) One thin long line */}
        <div className="skeleton-item" style={{ width: '92%', height: '12px', borderRadius: '6px', margin: '0 auto' }}></div>

        {/* 6) One thick shorter, centered */}
        <div className="skeleton-item" style={{ width: '60%', height: '24px', borderRadius: '8px', margin: '0 auto' }}></div>

        {/* Additional 4 rows: two columns with generous spacing */}
        <div style={{ width: '92%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
            <div className="skeleton-item" style={{ width: '46%', height: '16px', borderRadius: '8px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultSkeleton;
