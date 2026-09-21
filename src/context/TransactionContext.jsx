import React, { createContext, useState } from 'react';

export const TransactionContext = createContext();

// Initial dummy expense
const INITIAL_TRANSACTIONS = [
  
];

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

  // Global function to add an expense
  const addTransaction = (newExpense) => {
    setTransactions([newExpense, ...transactions]);
  };
  
const deleteTransaction = (id) => {
  setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== id));
};

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, setTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};