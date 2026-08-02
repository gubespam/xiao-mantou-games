import React from 'react';

function TabsBar({ tabs, activeTab, onSelect }) {
  return (
    <div className="tdocs-tabs-bar" role="tablist" aria-label="TDocs navigation tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`tdocs-tab ${activeTab === tab.id ? 'is-active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default TabsBar;
