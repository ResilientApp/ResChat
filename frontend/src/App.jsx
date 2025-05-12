import './i18n';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import ThemeProvider from './theme';
import RoutesComponent from './routes/index.jsx';
import ThemeSettings from './components/settings/index.jsx';
import SettingsProvider from './contexts/SettingsContext';
import { store } from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <SettingsProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ThemeSettings>
              <RoutesComponent />
            </ThemeSettings>
          </BrowserRouter>
        </ThemeProvider>
      </SettingsProvider>
    </Provider>
  );
}

export default App;
