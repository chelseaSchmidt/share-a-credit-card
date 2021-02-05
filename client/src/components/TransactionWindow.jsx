import React from 'react';
import {
  arrayOf,
  shape,
  string,
  func,
} from 'prop-types';
import Transaction from './Transaction';
import '../styles/TransactionWindow.css';
import { toId } from '../../utilities/general';

const TransactionWindow = ({
  title,
  transactions,
  isolatedTransactions,
  selectOne = () => {},
  selectAll = () => {},
  selection = [],
}) => {
  const noTransactions = transactions.length === 0;
  const isEditable = title === 'Transactions in Shared Categories';
  const isSplitAcct = title === 'Account Receiving Split Transaction';
  const isolatedTransactionIds = isolatedTransactions.map(toId);
  const selectionIds = (selection || []).map(toId);
  const areAllChecked = selection.length > 0 && selection.length === transactions.length;

  return (
    <div className="transaction-window">
      <h3 className="window-title">{title}</h3>
      <div className="select-all-area">
        {!noTransactions
        && isEditable
        && (
          <label htmlFor="select-all-input">
            <input type="checkbox" checked={areAllChecked} onChange={selectAll} id="select-all-input" />
            Select All
          </label>
        )}
      </div>
      <div className="transaction-feed">
        {!noTransactions && transactions.map((txn) => {
          let isIsolated = false;
          if (isolatedTransactionIds.indexOf(txn.id) > -1) {
            isIsolated = true;
          }
          return (
            <Transaction
              checked={selectionIds.includes(txn.id)}
              transaction={txn}
              type={title}
              onClick={() => selectOne(txn)}
              isIsolated={isIsolated}
              isSplitAcct={isSplitAcct}
              key={txn.id}
            />
          );
        })}
      </div>
      {noTransactions && <span><em>No transactions</em></span>}
    </div>
  );
};

TransactionWindow.propTypes = {
  transactions: arrayOf(shape({ id: string })).isRequired,
  isolatedTransactions: arrayOf(shape({ id: string })).isRequired,
  selection: arrayOf(shape({ id: string })),
  title: string.isRequired,
  selectOne: func,
  selectAll: func,
};

export default TransactionWindow;
