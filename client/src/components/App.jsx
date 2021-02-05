/* eslint-disable no-param-reassign, camelcase */
import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import TransactionWindow from './TransactionWindow';
import AccountSelector from './AccountSelector';
import Confirmation from './Confirmation';
import PrivacyWindow from './PrivacyWindow';
import Header from './Header';
import Nav from './Nav';
import Error from './Error';
import {
  getAllTransactions,
  getAccounts,
  getCategories,
  createSplitTransaction,
} from '../../utilities/http';
import {
  getFiveDaysAgo,
  convertDateToString,
  convertStringToDate,
  checkIfDateInRange,
} from '../../utilities/dateHelpers';
import '../styles/App.css';
import { toId } from '../../utilities/general';

const App = (props) => {
  const [sinceDate, setSinceDate] = useState(getFiveDaysAgo());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [splitDate, setSplitDate] = useState(new Date());
  const [transactions, setTransactions] = useState({
    bankTransactions: [],
    catTransactions: [],
    isolatedTransactions: [],
    recipientTransactions: [],
    retrievedAfterCreate: false,
  });
  const [budgetData, setBudgetData] = useState({
    budgetAccounts: [{ name: '', id: '' }],
    budgetCategories: [{ name: '', id: '' }],
  });
  const [sharedAccounts, setSharedAccounts] = useState([]);
  const [sharedCategories, setSharedCategories] = useState([]);
  const [splitAccount, setSplitAccount] = useState('');
  const [error, setError] = useState({
    occurred: false,
    status: 0,
  });
  const [privacyActive, setPrivacyActive] = useState(true);

  const errorMessages = {
    401: 'Error: Authentication Failed. If the URL on this webpage appears as "https://costsharingforynab.com/cost-sharer/#", this is a bug. If not, and instead of "#" there is a long series of numbers and letters, your session may simply have expired. If it looks like a bug and you would like to help get it resolved, please send an email with the details to cost.sharing.for.ynab@gmail.com. Thank you for your patience!',
  };

  useEffect(() => {
    const budgetObj = {
      budgetAccounts: [],
      budgetCategories: [],
    };
    getAccounts()
      .then(({ data: { data: { accounts } } }) => {
        budgetObj.budgetAccounts = accounts
          .filter(({ closed }) => !closed)
          .map(({ name, id }) => { return { name, id }; }); // eslint-disable-line
        return getCategories();
      })
      .then(({ data: { data: { category_groups } } }) => {
        budgetObj.budgetCategories = _.flatten(category_groups
          .filter(({ hidden }) => !hidden)
          .map(({ name, id, categories }) => { return { name, id, categories }; })); // eslint-disable-line
        setBudgetData(budgetObj);
      })
      .catch((err) => {
        setError({
          occurred: true,
          status: err.response.status,
        });
      });
  }, [props]);

  function getTransactions(e = { preventDefault: () => {} }, retrievedAfterCreate = false) {
    e.preventDefault();
    const newTxns = {
      bankTransactions: [],
      catTransactions: [],
      isolatedTransactions: [],
      recipientTransactions: [],
      retrievedAfterCreate,
    };
    const sharedAccountIds = sharedAccounts.map((acct) => acct.accountId);
    const sharedCatIds = _.flatten(sharedCategories
      .map((catGroup) => catGroup.subCategories))
      .map(toId);
    getAllTransactions(sinceDate)
      .then(({ data: { data } }) => {
        data.transactions.filter((txn) => (
          checkIfDateInRange(txn.date, endDate)
          && txn.approved
          && !txn.transfer_account_id
        )).forEach((txn) => {
          let count = 0;
          if (splitAccount === txn.account_id) {
            newTxns.recipientTransactions.push(txn);
          }
          if (sharedAccountIds.indexOf(txn.account_id) > -1) {
            newTxns.bankTransactions.push(txn);
            count += 1;
          }
          if (sharedCatIds.indexOf(txn.category_id) > -1) {
            newTxns.catTransactions.push(txn);
            count += 1;
          }
          if (count === 1) {
            newTxns.isolatedTransactions.push(txn);
          }
        });
        setTransactions(newTxns);
      })
      .catch((err) => {
        setError({
          occurred: true,
          status: err.response.status,
        });
      });
  }

  const toggleOneTransaction = useCallback((transaction) => {
    setSelectedTransactions((selection) => (
      selection.includes(transaction)
        // Remove the transaction from selection
        ? selection.filter((item) => item !== transaction)
        // Add transaction to selection
        : [...selection, transaction]
    ));
  }, [setSelectedTransactions]);

  const toggleAllTransactions = useCallback(() => {
    setSelectedTransactions((selection) => (
      selection.length !== transactions.catTransactions.length
        ? [...transactions.catTransactions]
        : []
    ));
  }, [setSelectedTransactions, transactions.catTransactions]);

  function createSplitEntry(e) {
    e.preventDefault();
    const halvedCostsByCategory = selectedTransactions.reduce((totals, txn) => {
      if (txn.category_id in totals) {
        totals[txn.category_id] += Number((txn.amount / 1000 / 2).toFixed(2));
      } else {
        totals[txn.category_id] = Number((txn.amount / 1000 / 2).toFixed(2));
      }
      return totals;
    }, {});
    _.each(halvedCostsByCategory, (val, key) => {
      halvedCostsByCategory[key] = Number(val.toFixed(2));
      // TO DO: why is this conversion needed a second time?
    });
    const summaryTransaction = {
      account_id: splitAccount,
      date: convertDateToString(splitDate),
      amount: Number((
        _.reduce(halvedCostsByCategory, (sum, amt) => sum + amt) * 1000)
        .toFixed(2)) * -1,
      payee_id: null,
      payee_name: null,
      category_id: null,
      memo: null,
      cleared: 'uncleared',
      approved: true,
      flag_color: null,
      import_id: null,
      subtransactions: _.map(halvedCostsByCategory, (amt, catId) => ({
        amount: amt * -1000,
        payee_id: null,
        payee_name: 'Shared Costs',
        category_id: catId,
        memo: null,
      })),
    };
    createSplitTransaction(summaryTransaction)
      .then(() => {
        getTransactions(undefined, true);
      })
      .catch((err) => {
        setError({
          occurred: true,
          status: err.response.status,
        });
      });
  }

  const splitIsAllowed = selectedTransactions.length && splitAccount.length;

  return (
    <div className="app-container">
      {privacyActive && <PrivacyWindow setPrivacyActive={setPrivacyActive} />}
      <Header setPrivacyActive={setPrivacyActive} />
      <div className="section-container">
        <AccountSelector
          sharedAccounts={sharedAccounts}
          sharedCategories={sharedCategories}
          splitAccount={splitAccount}
          budgetData={budgetData}
          setSharedAccounts={setSharedAccounts}
          setSharedCategories={setSharedCategories}
          setSplitAccount={setSplitAccount}
        />
        <div id="date-range-area">
          <p>
            <b>Required:&nbsp;</b>
            Specify a date range, such as a one-month period, that you want to
            split transactions for. For example, you might calculate what the
            other person owes you for shared costs every week, two weeks, or
            once a month.
          </p>
          <form>
            <label htmlFor="start">
              Start date:
              <input
                type="date"
                id="start"
                value={convertDateToString(sinceDate)}
                onChange={(e) => setSinceDate(convertStringToDate(e.target.value))}
              />
            </label>
            <label htmlFor="end">
              End date:
              <input
                type="date"
                id="end"
                value={convertDateToString(endDate)}
                onChange={(e) => setEndDate(convertStringToDate(e.target.value, false))}
              />
            </label>
          </form>
        </div>
        <button
          type="button"
          onClick={() => { getTransactions(); document.getElementById('transaction-container').scrollIntoView(true); }}
          id="update-txn-btn"
          className="update-btn"
        >
          Show Transactions
        </button>
      </div>
      <section id="transaction-container" className="section-container">
        <h1 className="section-header">Select Transactions to Split</h1>
        <p>
          Select all the transactions in shared budget categories that you want
          included in the split transaction. If a transaction is present in a
          shared category but did not come from a shared banking account, or vice
          versa, you&apos;ll notice a yellow warning symbol. Use these warnings to review
          if anything is missing or incorrect.
        </p>
        <div id="transaction-area">
          <TransactionWindow
            title="Transactions in Shared Categories"
            transactions={transactions.catTransactions}
            isolatedTransactions={transactions.isolatedTransactions}
            selectOne={toggleOneTransaction}
            selectAll={toggleAllTransactions}
            selection={selectedTransactions}
          />
          <TransactionWindow
            title="Transactions in Shared Banking Accounts"
            transactions={transactions.bankTransactions}
            isolatedTransactions={transactions.isolatedTransactions}
          />
          <TransactionWindow
            title="Account Receiving Split Transaction"
            transactions={transactions.recipientTransactions}
            isolatedTransactions={transactions.isolatedTransactions}
          />
        </div>
      </section>
      <div id="split-btn-area" className="section-container">
        <form>
          <h1 className="section-header">Create Split Transaction</h1>
          <p>
            Choose a date you want to create the transaction in YNAB that will
            halve costs between you and the other person, and hit &quot;Split Selected
            Transactions On Date.&quot; The new transaction will be split across all
            the original categories, so you can continue to have visibility into
            where your shared dollars are being spent.
          </p>
          <input
            type="date"
            id="split-date"
            value={convertDateToString(splitDate)}
            onChange={(e) => setSplitDate(convertStringToDate(e.target.value))}
          />
          <button
            type="submit"
            onClick={createSplitEntry}
            id="split-txn-btn"
            className="update-btn"
            disabled={!splitIsAllowed}
          >
            Split Selected Transactions On Date
          </button>
          {!splitIsAllowed && (
            <span className="caution-text">
              Please select one or more transactions to split and choose an account
              to receive the split transaction
            </span>
          )}
        </form>
      </div>
      {transactions.retrievedAfterCreate && <Confirmation />}
      {error.occurred && <Error message={errorMessages[error.status]} setError={setError} />}
      <Nav setPrivacyActive={setPrivacyActive} />
    </div>
  );
};

export default App;
