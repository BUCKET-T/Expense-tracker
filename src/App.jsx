import React from 'react';
import './App.css';
import { TransactionProvider } from './context/TransactionContext';
import { ThemeProvider } from './context/ThemeContext';
import Operator from './Routing/Operator';
import { AuthProvider } from './context/AuthContext';


const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TransactionProvider>
          <Operator />
        </TransactionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;