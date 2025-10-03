import React from 'react';

interface TableSkeletonProps {
  showStats?: boolean;
  rowCount?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  showStats = false, 
  rowCount = 8 
}) => {
  const skeletonRows = Array.from({ length: rowCount }, (_, index) => (
    <div key={index} className={`vault-row skeleton-row ${!showStats ? 'vault-row-tvl-hidden' : ''}`}>
      {/* Vault name and icon */}
      <div className="vault-cell vault-left-align">
        <div className="skeleton-item" style={{ width: '90%', height: '20px' }}></div>
      </div>
      
      {/* Deposits */}
      <div className="vault-cell vault-left-align">
        <div className="skeleton-item" style={{ width: '80%', height: '16px' }}></div>
      </div>
      
      {/* Yield/APR */}
      <div className="vault-cell vault-yield-tvl">
        <div className="skeleton-item" style={{ width: '70%', height: '16px' }}></div>

      </div>
      
      {/* TVL (only show if showStats is true) */}
      {showStats && (
        <div className="vault-cell vault-deposits-tvl">
          <div className="skeleton-item" style={{ width: '120%', height: '16px', marginLeft: 'auto' }}></div>
        </div>
      )}
      
      {/* Contributed 7d - positioned as the rightmost column */}
      <div className="vault-cell vault-deposits-tvl">
        <div className="skeleton-item" style={{ width: '40%', height: '16px', marginLeft: 'auto' }}></div>
      </div>
    </div>
  ));

  return (
    <div className="vault-table-body">
      {skeletonRows}
    </div>
  );
};

export default TableSkeleton;

