/* eslint-disable camelcase */
import React from 'react';
import moment from 'moment';
import formatCurrency from 'format-currency';
import {
  shape,
  string,
  number,
  bool,
  func,
} from 'prop-types';

const Transaction = ({
  type,
  onClick,
  transaction,
  isIsolated,
  isSplitAcct,
  checked = false,
}) => {
  const clickable = type === 'Transactions in Shared Categories';
  const currencyOpts = { format: '%s%v', symbol: '$' };
  const {
    date,
    amount,
    payee_name,
    category_name,
    account_name,
  } = transaction;
  return (
    <div className={`transaction ${clickable ? 'clickable' : ''}`} onClick={onClick}>
      {isIsolated && !isSplitAcct && <span className="warning-symbol" />}
      {!isIsolated && !isSplitAcct && <span className="validated-symbol" />}
      {clickable && <input type="checkbox" className="clickable" checked={checked} readOnly />}
      <div className="txn-date">
        {moment(date).format('MMM DD, YYYY')}
      </div>
      <div className="txn-amt">
        {formatCurrency(amount / -1000, currencyOpts)}
      </div>
      <div className="txn-details">
        <div className="txn-cat">
          {category_name}
        </div>
        <div className="txn-payee">
          {payee_name}
        </div>
        <div className="txn-acct">
          {account_name}
        </div>
        <div className="txn-more">
          <button className="more-btn">More</button>
          {/* TO DO */}
        </div>
      </div>
    </div>
  );
};

Transaction.propTypes = {
  type: string.isRequired,
  onClick: func,
  isIsolated: bool.isRequired,
  isSplitAcct: bool.isRequired,
  checked: bool,
  transaction: shape({
    id: string,
    date: string,
    amount: number,
    memo: string,
    cleared: string,
    approved: bool,
    payee_name: string,
    category_name: string,
  }).isRequired,
};

export default Transaction;
